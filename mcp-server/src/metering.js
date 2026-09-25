import crypto from "node:crypto";

// Usage metering client.
//
// This talks to the Opskeep admin server's `/api/usage/charge` endpoint to draw
// down a customer's credit balance when they run a billable tool. It is entirely
// OPTIONAL: the open-source pack runs standalone, so metering stays dormant
// unless the admin URL, an API key, and a customer identifier are all configured.
// When dormant, `meterTool` returns the tool untouched — zero overhead, no calls.

const ADMIN_URL = (process.env.OPSKEEP_ADMIN_URL || "").replace(/\/$/, "");
const API_KEY = process.env.OPSKEEP_USAGE_API_KEY || "";
const CUSTOMER_ID = process.env.OPSKEEP_CUSTOMER_ID || "";
const CUSTOMER_EMAIL = process.env.OPSKEEP_CUSTOMER_EMAIL || "";

// On a transient failure to reach the billing server, allow the action rather
// than block a paying customer over a hiccup. Set OPSKEEP_METERING_FAIL_OPEN=0
// to fail closed (refuse the action) instead.
const FAIL_OPEN = process.env.OPSKEEP_METERING_FAIL_OPEN !== "0";

const TIMEOUT_MS = Number(process.env.OPSKEEP_METERING_TIMEOUT_MS) || 5000;

export function meteringEnabled() {
  return Boolean(ADMIN_URL && API_KEY && (CUSTOMER_ID || CUSTOMER_EMAIL));
}

function customerRef() {
  if (CUSTOMER_ID) return { customerId: Number(CUSTOMER_ID) };
  return { customerEmail: CUSTOMER_EMAIL };
}

// Charge one action. Resolves to a small result object the caller acts on:
//   { ok: true, ... }                                   — charged, free, or deduped
//   { ok: false, reason: "insufficient", balance, required }
//   { ok: false, reason: "forbidden", detail }          — e.g. cancelled customer
//   { ok: false, reason: "error", detail }              — network/timeout/5xx
async function charge(action, { units = 1, eventId } = {}) {
  const body = { ...customerRef(), action, units, eventId: eventId || crypto.randomUUID() };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${ADMIN_URL}/api/usage/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    return { ok: false, reason: "error", detail: err.name === "AbortError" ? "timeout" : err.message };
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }

  if (res.ok) {
    return { ok: true, balance: data?.balance, charged: data?.charged, deduped: data?.deduped };
  }
  if (res.status === 402) {
    return { ok: false, reason: "insufficient", balance: data?.balance, required: data?.required };
  }
  if (res.status === 403) {
    return { ok: false, reason: "forbidden", detail: data?.error };
  }
  return { ok: false, reason: "error", status: res.status, detail: data?.error };
}

function mcpError(text) {
  return { isError: true, content: [{ type: "text", text }] };
}

// Wrap a tool so it charges `action` before running. Gating is strict: an
// out-of-credits or cancelled customer is refused BEFORE the tool does any work,
// so the balance can never go negative. Returns the tool unchanged when metering
// is disabled.
//
// Tradeoff (scaffold-level): the charge lands before the handler runs, so a
// handler that then errors has still spent the credit. Most handler failures
// here are cheap input-validation errors. Add a void/refund call once the admin
// API exposes one; marked TODO below.
export function meterTool(tool, action) {
  if (!meteringEnabled()) return tool;
  const original = tool.handler;
  return {
    ...tool,
    async handler(...handlerArgs) {
      const result = await charge(action);

      if (!result.ok) {
        if (result.reason === "insufficient") {
          return mcpError(
            `⚠ Out of credits: this action needs ${result.required ?? "more"} credit(s) but the ` +
              `balance is ${result.balance ?? 0}. Top up to continue.`
          );
        }
        if (result.reason === "forbidden") {
          return mcpError(`This account can't run billable actions right now (${result.detail || "forbidden"}).`);
        }
        // reason === "error": billing server unreachable / 5xx / timeout.
        if (!FAIL_OPEN) {
          return mcpError("Billing is temporarily unavailable, so this action was not run. Please try again shortly.");
        }
        console.error(
          `[metering] charge failed for ${action} (${result.detail || result.status}); allowing action (fail-open).`
        );
      }

      // TODO: if `original` throws or returns isError, void the charge above once
      // the admin API supports it, so failed actions aren't billed.
      return original(...handlerArgs);
    },
  };
}
