#!/usr/bin/env node
// Opskeep admin dashboard: manage the clients you run AI agents for, their API
// keys, credit balances, and agent usage, and queue agent runs. Reads and
// writes the same JSON store as the opskeep-tools MCP server (see store.js).
//
// Setup (all optional except creating a password): set these as real
// environment variables, or copy .env.example to .env in this directory and
// fill it in — .env is loaded automatically (see loadEnv.js) and gitignored.
//   OPSKEEP_ADMIN_USERNAME   owner name, default "owner"
//   OPSKEEP_ADMIN_PASSWORD   login password; if unset a random one is printed at startup
//   OPSKEEP_ADMIN_SECRET     secret for signing session cookies; random per boot if unset
//   OPSKEEP_ADMIN_PORT       default 8377
//   OPSKEEP_ADMIN_HOST       default 127.0.0.1 (local only)
//   OPSKEEP_STORE_FILE       shared store file, same default as the MCP server
//   OPSKEEP_KEY_ENCRYPTION_SECRET  required (24+ chars) before saving provider keys;
//                            encrypts them at rest (AES-256-GCM) in the shared store.
//   OPSKEEP_AGENT_RUNNER     optional external agent runner. If unset and a run has a
//                            selected client key, the admin server calls the provider
//                            itself (see providers.js) and records the result and token
//                            usage directly. A bare command on PATH runs without a
//                            shell; a command with arguments or a .cmd/.bat/.ps1 script
//                            runs through the shell. Run JSON is passed in
//                            OPSKEEP_RUN_JSON: { runId, clientName, clientWebsite, task,
//                            storeFile, keyId, provider, model }. The runner resolves the
//                            key itself (decryptSecret in secrets.js, using this same
//                            OPSKEEP_KEY_ENCRYPTION_SECRET) — the raw key is never put in
//                            the payload.

import "./loadEnv.js";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  STORE_FILE,
  load,
  save,
  newId,
  findClient,
  balance,
  maskKeyValue,
} from "./store.js";
import { keyVaultConfigured, encryptSecret, decryptSecret } from "./secrets.js";
import { hashPassword, verifyPassword } from "./auth.js";
import { providerCatalog, providerModel, verifyProviderKey, runProvider, withProviderRetry } from "./providers.js";
import { ensurePricing, getModelPricing, setModelPricing, removeModelPricing, computeCostUSD } from "./pricing.js";
import { renderBillingSummaryPdf } from "./billingPdf.js";

const USERNAME = process.env.OPSKEEP_ADMIN_USERNAME || "owner";
const PASSWORD = process.env.OPSKEEP_ADMIN_PASSWORD || crypto.randomBytes(6).toString("hex");
const SECRET = process.env.OPSKEEP_ADMIN_SECRET || crypto.randomBytes(32).toString("hex");
const PORT = Number(process.env.OPSKEEP_ADMIN_PORT) || 8377;
const HOST = process.env.OPSKEEP_ADMIN_HOST || "127.0.0.1";
const RUNNER = process.env.OPSKEEP_AGENT_RUNNER || "";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

function log(message) {
  console.error(`[opskeep-admin] ${message}`);
}

// ---------- session auth ----------

function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function sessionCookieValue(username, expMs) {
  return `${Buffer.from(username).toString("base64url")}.${expMs}.${sign(`${username}:${expMs}`)}`;
}

function readSession(cookieHeader) {
  if (!cookieHeader) return null;
  const match = /opskeep_session=([^;]+)/.exec(cookieHeader);
  if (!match) return null;
  const parts = match[1].split(".");
  if (parts.length !== 3) return null;
  const [userB64, expStr, sig] = parts;
  const username = Buffer.from(userB64, "base64url").toString("utf8");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = sign(`${username}:${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  return username;
}

function requireAuth(req, res) {
  const username = readSession(req.headers.cookie);
  const authed = username === USERNAME;
  if (!authed) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not signed in." }));
  }
  return authed ? username : null;
}

// ---------- http helpers ----------

function json(res, code, data, extraHeaders = {}) {
  res.writeHead(code, { "Content-Type": "application/json", ...extraHeaders });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 1_000_000) {
        req.destroy();
        resolve(null);
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

function num(value, { allowZero = false } = {}) {
  const n = Number(value);
  return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0) ? n : null;
}

function str(value, max = 2000, { required = true } = {}) {
  if (typeof value !== "string") return required ? null : undefined;
  const s = value.trim().slice(0, max);
  return s.length ? s : required ? null : undefined;
}

function isoNow() {
  return new Date().toISOString();
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(values) {
  return values.map(csvCell).join(",") + "\r\n";
}

// Inclusive on both ends; `from`/`to` are "YYYY-MM-DD" strings, compared
// against just the date portion of the record's own date/timestamp field.
function inDateRange(dateStr, from, to) {
  const day = String(dateStr).slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

// ---------- agent run execution ----------

let runnerChild = null;

function providerLabel(id) {
  return providerCatalog().find((p) => p.id === id)?.label || id;
}

// Every currently-verified ("connected") key for a client, oldest first —
// the automatic failover order for a live run.
function connectedKeyChain(data, clientId) {
  return Object.entries(data.clientKeys ?? {})
    .filter(([, k]) => k.clientId === clientId && k.status === "connected")
    .sort((a, b) => String(a[1].addedAt).localeCompare(String(b[1].addedAt)))
    .map(([id, k]) => ({ id, ...k }));
}

// External runner: the raw key is never put in the payload. The runner gets a
// keyId and the shared store file, and resolves the secret itself the same
// way this process does (decryptSecret against the key's encrypted record,
// using OPSKEEP_KEY_ENCRYPTION_SECRET from its inherited environment).
//
// Scope note: the external runner only receives the FIRST key of the
// failover chain — extending its OPSKEEP_RUN_JSON protocol to carry and
// manage multi-key failover itself is a separate, larger change. Automatic
// failover across all connected keys only happens in the built-in runner
// below (used when OPSKEEP_AGENT_RUNNER is unset).
function startRunIfRunnerConfigured(data, run) {
  if (!RUNNER) return; // stays queued; owner completes manually
  const client = data.clients[run.clientId];
  const primaryKeyId = run.keyChain?.[0] ?? null;
  const keyRecord = primaryKeyId ? data.clientKeys?.[primaryKeyId] : null;
  const payload = JSON.stringify({
    runId: run.id,
    clientName: client?.name ?? null,
    clientWebsite: client?.website ?? null,
    task: run.task,
    storeFile: STORE_FILE,
    keyId: primaryKeyId,
    provider: keyRecord?.provider ?? null,
    model: keyRecord?.model ?? null,
  });
  // A bare command (e.g. a CLI on PATH) runs without a shell. Commands with
  // arguments or script files (.cmd/.bat/.ps1) need the shell.
  const useShell = RUNNER.includes(" ") || /\.(cmd|bat|ps1)$/i.test(RUNNER);
  const child = spawn(RUNNER, [], {
    shell: useShell,
    env: { ...process.env, OPSKEEP_RUN_JSON: payload },
    stdio: "ignore",
  });
  runnerChild = child;
  run.status = "running";
  run.runner = RUNNER;
  child.on("error", (err) => {
    run.status = "failed";
    run.finishedAt = isoNow();
    run.note = `Runner could not start: ${err.message}`;
    save(data);
  });
  child.on("close", (code) => {
    runnerChild = null;
    if (run.status === "running") {
      run.status = code === 0 ? "completed" : "failed";
      run.finishedAt = isoNow();
      run.note = code === 0 ? "Runner exited cleanly. Book usage to deduct from the balance." : `Runner exited with code ${code}.`;
      save(data);
    }
  });
}

// Built-in runner: used when no external OPSKEEP_AGENT_RUNNER is configured
// and the run has a live key chain (see connectedKeyChain — at least 3
// connected keys, any provider/model, oldest first). Tries each key in
// order; a key that fails (after its own retries — see withProviderRetry)
// is skipped in favor of the next one, so one revoked or rate-limited key
// doesn't fail the run. Decrypts each key server-side and never returns a
// key value to the caller.
async function executeRunInProcess(run, keyChain) {
  run.status = "running";
  run.runner = "built-in";
  let data = load();
  data.agentRuns[run.id] = run;
  save(data);

  const attempts = [];
  for (const keyRecord of keyChain) {
    const model = keyRecord.model || providerCatalog().find((p) => p.id === keyRecord.provider)?.models[0]?.id;
    try {
      const apiKey = decryptSecret(keyRecord.secret);
      const result = await withProviderRetry(() => runProvider({ provider: keyRecord.provider, model, apiKey, task: run.task }));
      attempts.push({ keyId: keyRecord.id, provider: keyRecord.provider, model, status: "succeeded" });

      data = load();
      const fresh = data.agentRuns[run.id];
      fresh.status = "completed";
      fresh.finishedAt = isoNow();
      fresh.result = result.text ? result.text.slice(0, 8000) : null;
      fresh.usage = result.usage;
      fresh.keyId = keyRecord.id;
      fresh.model = model;
      fresh.attempts = attempts;
      const fallbackNote = attempts.length > 1 ? ` (after ${attempts.length - 1} earlier key${attempts.length - 1 === 1 ? "" : "s"} failed over)` : "";

      const costUSD = computeCostUSD(data, keyRecord.provider, model, result.usage);
      if (costUSD != null && costUSD > 0) {
        const usageId = newId(data, "use");
        data.agentUsage[usageId] = {
          clientId: run.clientId,
          action: `run ${run.id}: ${run.task.slice(0, 200)}`,
          credits: costUSD,
          date: isoNow(),
          note: `Auto-booked from ${result.usage.inputTokens ?? "?"} in / ${result.usage.outputTokens ?? "?"} out tokens at the configured ${providerLabel(keyRecord.provider)} rate${fallbackNote}.`,
        };
        fresh.creditsBooked = costUSD;
        fresh.usageBooked = true;
        fresh.note = `Provider run completed via ${providerLabel(keyRecord.provider)}${fallbackNote}. Usage cost was booked automatically from the configured pricing.`;
      } else {
        fresh.usageBooked = false;
        fresh.note = `Provider run completed via ${providerLabel(keyRecord.provider)}${fallbackNote}. No pricing is set for this model yet — set it under Pricing, or book usage manually.`;
      }
      save(data);
      return;
    } catch (err) {
      attempts.push({ keyId: keyRecord.id, provider: keyRecord.provider, model, status: "failed", error: err.message });
    }
  }

  data = load();
  const fresh = data.agentRuns[run.id];
  fresh.status = "failed";
  fresh.finishedAt = isoNow();
  fresh.attempts = attempts;
  fresh.note = `All ${keyChain.length} connected keys failed: ${attempts.map((a) => `${providerLabel(a.provider)} (${a.error})`).join("; ")}`;
  save(data);
}

// ---------- route handlers ----------

async function handleApi(req, res, pathname) {
  const method = req.method;

  if (pathname === "/api/me" && method === "GET") {
    const user = requireAuth(req, res);
    if (!user) return;
    json(res, 200, { username: user, runnerConfigured: Boolean(RUNNER), storeFile: STORE_FILE, vaultConfigured: keyVaultConfigured() });
    return;
  }

  if (pathname === "/api/settings/password" && method === "POST") {
    const user = requireAuth(req, res);
    if (!user) return;
    const body = await readBody(req);
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (newPassword.length < 8) {
      json(res, 400, { error: "New password must be at least 8 characters." });
      return;
    }
    const data = load();
    const storedAuth = data.adminAuth;
    let currentOk;
    if (storedAuth?.passwordHash) {
      currentOk = verifyPassword(currentPassword, storedAuth.passwordHash);
    } else {
      const pwBuf = Buffer.from(currentPassword);
      const expected = Buffer.from(PASSWORD);
      currentOk = pwBuf.length === expected.length && crypto.timingSafeEqual(pwBuf, expected);
    }
    if (!currentOk) {
      json(res, 401, { error: "Current password is incorrect." });
      return;
    }
    data.adminAuth = { passwordHash: hashPassword(newPassword), updatedAt: isoNow() };
    save(data);
    json(res, 200, { ok: true });
    return;
  }

  if (pathname === "/api/login" && method === "POST") {
    const body = await readBody(req);
    if (!body || typeof body.username !== "string" || typeof body.password !== "string") {
      json(res, 400, { error: "Username and password are required." });
      return;
    }
    const storedAuth = load().adminAuth;
    let passwordOk;
    if (storedAuth?.passwordHash) {
      passwordOk = verifyPassword(body.password, storedAuth.passwordHash);
    } else {
      const pwBuf = Buffer.from(body.password);
      const expected = Buffer.from(PASSWORD);
      passwordOk = pwBuf.length === expected.length && crypto.timingSafeEqual(pwBuf, expected);
    }
    const ok = body.username === USERNAME && passwordOk;
    if (!ok) {
      json(res, 401, { error: "Invalid username or password." });
      return;
    }
    const exp = Date.now() + SESSION_TTL_MS;
    const cookie = `opskeep_session=${sessionCookieValue(USERNAME, exp)}; Path=/; HttpOnly; SameSite=Lax${HOST === "127.0.0.1" ? "" : "; Secure"}`;
    json(res, 200, { ok: true }, { "Set-Cookie": cookie });
    return;
  }

  if (pathname === "/api/logout" && method === "POST") {
    const user = requireAuth(req, res);
    if (!user) return;
    json(res, 200, { ok: true }, { "Set-Cookie": "opskeep_session=; Path=/; HttpOnly; Max-Age=0" });
    return;
  }

  const user = requireAuth(req, res);
  if (!user) return;

  const data = load();
  const respond = (code, obj) => json(res, code, obj);

  // clients
  if (pathname === "/api/clients" && method === "GET") {
    const list = Object.entries(data.clients ?? {}).map(([id, c]) => {
      const { syncSecret, ...safeClient } = c;
      const b = balance(data, id);
      const keyCount = Object.values(data.clientKeys ?? {}).filter(
        (k) => k.clientId === id && k.status !== "removed"
      ).length;
      return { id, ...safeClient, syncSecretConfigured: Boolean(syncSecret), keys: keyCount, purchased: b.purchased, used: b.used, remaining: b.remaining };
    });
    respond(200, { clients: list });
    return;
  }

  if (pathname === "/api/clients" && method === "POST") {
    const body = await readBody(req);
    const name = str(body?.name);
    const website = str(body?.website, 500);
    if (!name || !website) {
      respond(400, { error: "name and website are required." });
      return;
    }
    const existing = findClient(data, website);
    if (existing) {
      const [id, c] = existing;
      data.clients[id] = {
        ...c,
        name,
        notes: str(body?.notes, 2000, { required: false }) ?? c.notes,
        spendingLimit: body?.spendingLimit !== undefined ? num(body?.spendingLimit, { allowZero: true }) : c.spendingLimit,
      };
      save(data);
      respond(200, { id, ...data.clients[id] });
      return;
    }
    const id = newId(data, "cli");
    data.clients[id] = {
      name,
      website,
      notes: str(body?.notes, 2000, { required: false }) ?? null,
      spendingLimit: num(body?.spendingLimit, { allowZero: true }),
      createdAt: isoNow(),
    };
    save(data);
    respond(201, { id, ...data.clients[id] });
    return;
  }

  const clientMatch = /^\/api\/clients\/([^/]+)$/.exec(pathname);
  const clientKeysMatch = /^\/api\/clients\/([^/]+)\/keys$/.exec(pathname);
  const clientKeyRemoveMatch = /^\/api\/clients\/([^/]+)\/keys\/([^/]+)$/.exec(pathname);
  const purchasesMatch = /^\/api\/clients\/([^/]+)\/purchases$/.exec(pathname);
  const usageMatch = /^\/api\/clients\/([^/]+)\/usage$/.exec(pathname);
  const runsMatch = /^\/api\/agents\/runs$/.exec(pathname);
  const runActionMatch = /^\/api\/agents\/runs\/([^/]+)\/(complete|cancel)$/.exec(pathname);

  // client detail
  if (clientMatch && method === "GET") {
    const found = findClient(data, decodeURIComponent(clientMatch[1]));
    if (!found) {
      respond(404, { error: "No client found." });
      return;
    }
    const [id, c] = found;
    const { syncSecret, ...safeClient } = c;
    const withId = (map, ref) =>
      Object.entries(map ?? {})
        .filter(([, v]) => v.clientId === id)
        .map(([mapId, v]) => ({ id: mapId, ...v }));
    respond(200, {
      id,
      ...safeClient,
      syncSecretConfigured: Boolean(syncSecret),
      keys: withId(data.clientKeys).map(({ secret, ...safe }) => safe),
      purchases: withId(data.creditPurchases),
      usage: withId(data.agentUsage),
      runs: withId(data.agentRuns),
      balance: balance(data, id),
    });
    return;
  }

  const billingSummaryMatch = /^\/api\/clients\/([^/]+)\/billing-summary$/.exec(pathname);
  if (billingSummaryMatch && method === "GET") {
    const found = findClient(data, decodeURIComponent(billingSummaryMatch[1]));
    if (!found) {
      respond(404, { error: "No client found." });
      return;
    }
    const [id, client] = found;
    const url = new URL(req.url, "http://x");
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const purchases = Object.entries(data.creditPurchases ?? {})
      .filter(([, p]) => p.clientId === id && inDateRange(p.date, from, to))
      .map(([pid, p]) => ({ id: pid, ...p }))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const usage = Object.entries(data.agentUsage ?? {})
      .filter(([, u]) => u.clientId === id && inDateRange(u.date, from, to))
      .map(([uid, u]) => ({ id: uid, ...u }))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));

    const totals = {
      purchased: purchases.reduce((sum, p) => sum + (Number(p.credits) || 0), 0),
      used: usage.reduce((sum, u) => sum + (Number(u.credits) || 0), 0),
    };
    totals.net = totals.purchased - totals.used;

    const summary = {
      client: { id, name: client.name, website: client.website },
      range: { from: from || null, to: to || null },
      purchases,
      usage,
      totals,
      balanceAllTime: balance(data, id),
    };

    if ((url.searchParams.get("format") || "").toLowerCase() === "csv") {
      let csv = csvRow(["Client", client.name]);
      csv += csvRow(["Website", client.website]);
      csv += csvRow(["Range", from || "all-time", to || "all-time"]);
      csv += csvRow(["Total purchased (credits)", totals.purchased]);
      csv += csvRow(["Total used (credits = USD)", totals.used]);
      csv += csvRow(["Net (purchased - used)", totals.net]);
      csv += "\r\n";
      csv += csvRow(["Type", "Date", "Description", "Credits", "Amount", "Currency", "Reference"]);
      for (const p of purchases) {
        csv += csvRow(["Purchase", p.date, "Credit purchase", p.credits, p.amount ?? "", p.currency ?? "", p.ref ?? ""]);
      }
      for (const u of usage) {
        csv += csvRow(["Usage", u.date, u.action || u.note || "Agent usage", -Math.abs(Number(u.credits) || 0), "", "", u.note ?? ""]);
      }
      const filename = `${client.website.replace(/[^a-z0-9.-]/gi, "_")}-billing${from || to ? `-${from || "start"}_${to || "now"}` : ""}.csv`;
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      });
      res.end(csv);
      return;
    }

    if ((url.searchParams.get("format") || "").toLowerCase() === "pdf") {
      const pdfBuffer = await renderBillingSummaryPdf(summary);
      const filename = `${client.website.replace(/[^a-z0-9.-]/gi, "_")}-billing${from || to ? `-${from || "start"}_${to || "now"}` : ""}.pdf`;
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length,
      });
      res.end(pdfBuffer);
      return;
    }

    respond(200, summary);
    return;
  }

  if (clientMatch && method === "PATCH") {
    const found = findClient(data, decodeURIComponent(clientMatch[1]));
    if (!found) {
      respond(404, { error: "No client found." });
      return;
    }
    const [id, c] = found;
    const body = await readBody(req);
    const updated = { ...c };
    const name = str(body?.name, 500, { required: false });
    const website = str(body?.website, 500, { required: false });
    const notes = str(body?.notes, 2000, { required: false });
    if (name !== undefined) updated.name = name;
    if (website !== undefined) {
      const clash = findClient(data, website);
      if (clash && clash[0] !== id) {
        respond(409, { error: "Another client already uses that website." });
        return;
      }
      updated.website = website;
    }
    if (notes !== undefined) updated.notes = notes;
    if (body?.spendingLimit !== undefined) {
      updated.spendingLimit = body.spendingLimit === null ? null : num(body.spendingLimit, { allowZero: true });
    }
    if (body?.syncUrl !== undefined) {
      updated.syncUrl = str(body.syncUrl, 500, { required: false }) ?? null;
    }
    if (body?.syncSecret !== undefined) {
      const secretValue = str(body.syncSecret, 400, { required: false });
      if (secretValue) {
        if (!keyVaultConfigured()) {
          respond(400, { error: "Set OPSKEEP_KEY_ENCRYPTION_SECRET (24+ characters) before saving a site sync secret." });
          return;
        }
        updated.syncSecret = encryptSecret(secretValue);
      } else {
        updated.syncSecret = null;
      }
    }
    data.clients[id] = updated;
    save(data);
    const { syncSecret, ...safeClient } = updated;
    respond(200, { id, ...safeClient, syncSecretConfigured: Boolean(syncSecret) });
    return;
  }

  if (pathname === "/api/providers" && method === "GET") {
    respond(200, { providers: providerCatalog(), vaultConfigured: keyVaultConfigured() });
    return;
  }

  if (pathname === "/api/pricing" && method === "GET") {
    respond(200, { pricing: Object.values(ensurePricing(data)) });
    return;
  }

  const pricingMatch = /^\/api\/pricing\/([^/]+)\/([^/]+)$/.exec(pathname);
  if (pricingMatch && method === "PUT") {
    const [, provider, model] = pricingMatch.map(decodeURIComponent);
    if (!providerModel(provider, model)) {
      respond(400, { error: `"${model}" is not a known model for "${provider}".` });
      return;
    }
    const body = await readBody(req);
    const inputPer1M = num(body?.inputPer1M, { allowZero: true });
    const outputPer1M = num(body?.outputPer1M, { allowZero: true });
    if (inputPer1M === null || outputPer1M === null) {
      respond(400, { error: "inputPer1M and outputPer1M (USD per 1M tokens, 0 or more) are required." });
      return;
    }
    const entry = setModelPricing(data, provider, model, { inputPer1M, outputPer1M });
    save(data);
    respond(200, entry);
    return;
  }
  if (pricingMatch && method === "DELETE") {
    const [, provider, model] = pricingMatch.map(decodeURIComponent);
    removeModelPricing(data, provider, model);
    save(data);
    respond(200, { ok: true });
    return;
  }

  if (clientKeysMatch && method === "POST") {
    const found = findClient(data, decodeURIComponent(clientKeysMatch[1]));
    if (!found) {
      respond(404, { error: "No client found." });
      return;
    }
    const [id] = found;
    if (!keyVaultConfigured()) {
      respond(400, { error: "Set OPSKEEP_KEY_ENCRYPTION_SECRET (24+ characters) on the admin server before saving provider keys." });
      return;
    }
    const body = await readBody(req);
    const provider = str(body?.provider, 200);
    const keyValue = str(body?.keyValue, 2000);
    const model = str(body?.model, 200, { required: false }) ?? null;
    if (!provider || !keyValue) {
      respond(400, { error: "provider and keyValue are required." });
      return;
    }
    const catalogEntry = providerCatalog().find((p) => p.id === provider);
    if (!catalogEntry) {
      respond(400, { error: `Unknown provider "${provider}".` });
      return;
    }
    if (model && !providerModel(provider, model)) {
      respond(400, { error: `"${model}" is not one of ${catalogEntry.label}'s available models.` });
      return;
    }
    const keyId = newId(data, "key");
    data.clientKeys[keyId] = {
      clientId: id,
      provider,
      model,
      keyLabel: str(body?.keyLabel, 300, { required: false }) ?? null,
      keyMask: maskKeyValue(keyValue),
      secret: encryptSecret(keyValue),
      status: "not_checked",
      lastValidatedAt: null,
      addedAt: isoNow(),
    };
    save(data);
    const { secret, ...safe } = data.clientKeys[keyId];
    respond(201, { id: keyId, ...safe });
    return;
  }

  const clientKeyVerifyMatch = /^\/api\/clients\/([^/]+)\/keys\/([^/]+)\/verify$/.exec(pathname);
  if (clientKeyVerifyMatch && method === "POST") {
    const keyRecord = data.clientKeys?.[decodeURIComponent(clientKeyVerifyMatch[2])];
    if (!keyRecord) {
      respond(404, { error: "No key with that id." });
      return;
    }
    try {
      const apiKey = decryptSecret(keyRecord.secret);
      await verifyProviderKey(keyRecord.provider, apiKey);
      keyRecord.status = "connected";
    } catch (err) {
      keyRecord.status = /rate.?limit|429/i.test(err.message) ? "rate_limited" : "invalid";
      keyRecord.lastError = err.message;
    }
    keyRecord.lastValidatedAt = isoNow();
    save(data);
    const { secret, ...safe } = keyRecord;
    respond(200, { id: clientKeyVerifyMatch[2], ...safe });
    return;
  }

  const clientKeyRotateMatch = /^\/api\/clients\/([^/]+)\/keys\/([^/]+)\/rotate$/.exec(pathname);
  if (clientKeyRotateMatch && method === "POST") {
    const keyRecord = data.clientKeys?.[decodeURIComponent(clientKeyRotateMatch[2])];
    if (!keyRecord || keyRecord.status === "removed") {
      respond(404, { error: "No active key with that id." });
      return;
    }
    if (!keyVaultConfigured()) {
      respond(400, { error: "Set OPSKEEP_KEY_ENCRYPTION_SECRET (24+ characters) on the admin server before rotating provider keys." });
      return;
    }
    const body = await readBody(req);
    const keyValue = str(body?.keyValue, 2000);
    if (!keyValue) {
      respond(400, { error: "keyValue is required." });
      return;
    }
    keyRecord.keyMask = maskKeyValue(keyValue);
    keyRecord.secret = encryptSecret(keyValue);
    keyRecord.status = "not_checked";
    keyRecord.lastValidatedAt = null;
    keyRecord.lastError = null;
    keyRecord.rotatedAt = isoNow();
    save(data);
    const { secret, ...safe } = keyRecord;
    respond(200, { id: clientKeyRotateMatch[2], ...safe });
    return;
  }

  const clientKeyPushMatch = /^\/api\/clients\/([^/]+)\/keys\/([^/]+)\/push$/.exec(pathname);
  if (clientKeyPushMatch && method === "POST") {
    const found = findClient(data, decodeURIComponent(clientKeyPushMatch[1]));
    if (!found) {
      respond(404, { error: "No client found." });
      return;
    }
    const [clientId, client] = found;
    const keyRecord = data.clientKeys?.[decodeURIComponent(clientKeyPushMatch[2])];
    if (!keyRecord || keyRecord.clientId !== clientId || keyRecord.status === "removed") {
      respond(404, { error: "No active key with that id for this client." });
      return;
    }
    if (!client.syncUrl || !client.syncSecret) {
      respond(400, { error: `${client.name} has no site sync URL/secret configured yet. Set both under this client's Site sync settings first.` });
      return;
    }
    const body = await readBody(req);
    const enabled = typeof body?.enabled === "boolean" ? body.enabled : undefined;

    let pushOk = false;
    let pushError = null;
    try {
      const apiKey = decryptSecret(keyRecord.secret);
      const secretPlain = decryptSecret(client.syncSecret);
      const res = await fetch(client.syncUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${secretPlain}` },
        body: JSON.stringify({ provider: keyRecord.provider, model: keyRecord.model ?? undefined, keyValue: apiKey, enabled }),
        signal: AbortSignal.timeout(15_000),
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resBody?.error || `${res.status} ${res.statusText}`);
      pushOk = true;
    } catch (err) {
      pushError = err.name === "TimeoutError" ? "Request timed out." : err.message;
    }

    keyRecord.lastPushedAt = isoNow();
    keyRecord.lastPushError = pushOk ? null : pushError;
    save(data);

    if (!pushOk) {
      respond(502, { error: `Push to ${client.name}'s site failed: ${pushError}` });
      return;
    }
    respond(200, { ok: true, pushedAt: keyRecord.lastPushedAt });
    return;
  }

  if (clientKeyRemoveMatch && method === "DELETE") {
    const keyRecord = data.clientKeys?.[decodeURIComponent(clientKeyRemoveMatch[2])];
    if (!keyRecord) {
      respond(404, { error: "No key with that id." });
      return;
    }
    keyRecord.status = "removed";
    delete keyRecord.secret;
    save(data);
    respond(200, { ok: true });
    return;
  }

  if (purchasesMatch && method === "POST") {
    const found = findClient(data, decodeURIComponent(purchasesMatch[1]));
    if (!found) {
      respond(404, { error: "No client found." });
      return;
    }
    const [id] = found;
    const body = await readBody(req);
    const credits = num(body?.credits);
    if (!credits) {
      respond(400, { error: "credits (a positive number) is required." });
      return;
    }
    const purchaseId = newId(data, "cr");
    data.creditPurchases[purchaseId] = {
      clientId: id,
      credits,
      amount: num(body?.amount, { allowZero: true }),
      currency: (body?.currency && str(body.currency, 20)) || "USD",
      ref: str(body?.ref, 300, { required: false }) ?? null,
      date: str(body?.date, 100, { required: false }) ?? isoNow(),
    };
    save(data);
    respond(201, { id: purchaseId, ...data.creditPurchases[purchaseId] });
    return;
  }

  if (usageMatch && method === "POST") {
    const found = findClient(data, decodeURIComponent(usageMatch[1]));
    if (!found) {
      respond(404, { error: "No client found." });
      return;
    }
    const [id] = found;
    const body = await readBody(req);
    const credits = num(body?.credits);
    if (!credits) {
      respond(400, { error: "credits (a positive number) is required." });
      return;
    }
    const usageId = newId(data, "use");
    data.agentUsage[usageId] = {
      clientId: id,
      action: str(body?.action, 500, { required: false }) ?? null,
      credits,
      date: str(body?.date, 100, { required: false }) ?? isoNow(),
      note: str(body?.note, 1000, { required: false }) ?? null,
    };
    save(data);
    respond(201, { id: usageId, ...data.agentUsage[usageId] });
    return;
  }

  // agent runs
  if (pathname === "/api/agents/status" && method === "GET") {
    respond(200, { runnerConfigured: Boolean(RUNNER), runner: RUNNER });
    return;
  }

  if (runsMatch && method === "GET") {
    const url = new URL(req.url, "http://x");
    const clientRef = url.searchParams.get("client");
    let list = Object.entries(data.agentRuns ?? {}).map(([id, r]) => ({
      id,
      ...r,
      clientName: data.clients?.[r.clientId]?.name ?? r.clientId,
    }));
    if (clientRef) {
      const found = findClient(data, clientRef);
      if (!found) {
        respond(404, { error: "No client found." });
        return;
      }
      list = list.filter((r) => r.clientId === found[0]);
    }
    list.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
    respond(200, { runs: list });
    return;
  }

  if (runsMatch && method === "POST") {
    const body = await readBody(req);
    const found = findClient(data, str(body?.clientRef, 500) ?? "");
    const task = str(body?.task, 2000);
    if (!found || !task) {
      respond(400, { error: "clientRef and task are required." });
      return;
    }
    const [clientId] = found;
    const live = Boolean(body?.live);
    let keyChain = [];
    if (live) {
      keyChain = connectedKeyChain(data, clientId);
      if (keyChain.length < 3) {
        respond(409, {
          error: `${data.clients[clientId].name} needs at least 3 verified ("connected") keys before a live run can start — currently has ${keyChain.length} connected. Add and verify more keys under this client, or queue without running.`,
        });
        return;
      }
      const bal = balance(data, clientId);
      if (bal.remaining <= 0) {
        respond(409, { error: `${data.clients[clientId].name} has no remaining credit balance. Top up before running.` });
        return;
      }
      const limit = data.clients[clientId].spendingLimit;
      if (limit != null && bal.used >= limit) {
        respond(409, { error: `${data.clients[clientId].name} has reached its spending limit (${limit} credits used). Raise the limit to keep running.` });
        return;
      }
    }
    const runId = newId(data, "run");
    const run = {
      id: runId,
      clientId,
      task,
      keyId: null,
      model: null,
      keyChain: keyChain.map((k) => k.id),
      attempts: [],
      status: "queued",
      runner: RUNNER || (live ? "built-in" : null),
      credits: null,
      startedAt: isoNow(),
      finishedAt: null,
      note: RUNNER ? null : live ? null : "No runner configured and no live run requested; complete the run manually to book usage.",
    };
    data.agentRuns[runId] = run;
    save(data);
    if (RUNNER) {
      startRunIfRunnerConfigured(data, run);
      save(data);
    } else if (live) {
      executeRunInProcess(run, keyChain); // async; polls/refresh will pick up the result
    }
    respond(201, { id: runId, ...data.agentRuns[runId], clientName: data.clients[clientId].name });
    return;
  }

  if (runActionMatch) {
    const [runId, action] = [decodeURIComponent(runActionMatch[1]), runActionMatch[2]];
    const run = data.agentRuns?.[runId];
    if (!run) {
      respond(404, { error: "No run with that id." });
      return;
    }
    if (action === "cancel") {
      if (run.status === "completed") {
        respond(409, { error: "A completed run cannot be cancelled." });
        return;
      }
      run.status = "cancelled";
      run.finishedAt = isoNow();
      save(data);
      respond(200, { id: runId, ...run });
      return;
    }
    if (action === "complete") {
      if (run.usageBooked) {
        respond(409, { error: "This run's usage is already booked." });
        return;
      }
      const body = await readBody(req);
      const credits = num(body?.credits, { allowZero: true });
      if (credits === null) {
        respond(400, { error: "credits (a non-negative number) is required to complete a run." });
        return;
      }
      run.status = "completed";
      run.finishedAt = run.finishedAt ?? isoNow();
      if (credits > 0) {
        const usageId = newId(data, "use");
        data.agentUsage[usageId] = {
          clientId: run.clientId,
          action: `run ${runId}: ${run.task.slice(0, 200)}`,
          credits,
          date: isoNow(),
          note: str(body?.note, 1000, { required: false }) ?? null,
        };
        run.creditsBooked = credits;
      }
      run.usageBooked = true;
      save(data);
      respond(200, { id: runId, ...run });
      return;
    }
  }

  respond(404, { error: "Not found." });
}

// ---------- static files ----------

function serveStatic(res, pathname, method) {
  if (method !== "GET" && method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed." }));
    return;
  }
  let fileName = pathname === "/" ? "/index.html" : pathname;
  if (fileName.startsWith("/login") && fileName.endsWith(".html")) fileName = "/login.html";
  const resolved = path.normalize(path.join(PUBLIC_DIR, fileName));
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(resolved, (err, buf) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(resolved);
    const types = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
    };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(buf);
  });
}

// ---------- server ----------

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
    } else {
      serveStatic(res, pathname, req.method);
    }
  } catch (err) {
    log(String(err?.stack || err));
    if (!res.headersSent) {
      json(res, 500, { error: "Internal error." });
    }
  }
});

server.listen(PORT, HOST, () => {
  log(`admin dashboard on http://${HOST}:${PORT}`);
  if (!process.env.OPSKEEP_ADMIN_PASSWORD) {
    log(`no OPSKEEP_ADMIN_PASSWORD set; generated login password for "${USERNAME}": ${PASSWORD}`);
  }
});