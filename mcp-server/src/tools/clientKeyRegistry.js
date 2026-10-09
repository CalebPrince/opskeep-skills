import { z } from "zod";
import {
  clients,
  clientKeys,
  creditPurchases,
  agentUsage,
  newId,
} from "../store.js";
import { keyVaultConfigured, encryptSecret, decryptSecret } from "../secrets.js";
import { verifyProviderKey, isKnownProvider } from "../providerVerify.js";

// Per-client registry of AI API keys, credit top-ups, and agent usage, for the
// person who runs AI agents for clients. A client is identified by their
// website. The full key value is encrypted at rest (AES-256-GCM, see
// secrets.js) alongside a masked display reference; it is never echoed back
// in a tool response after the initial save. Recording a key still means
// typing it into this conversation once — see add_client_key's response for
// that reminder. Amounts and credit counts must be supplied by the caller;
// this module never invents a price or a usage figure.

function findClient(ref) {
  const byId = clients.get(ref);
  if (byId) return [ref, byId];
  const byWebsite = [...clients.entries()].find(([, c]) => c.website === ref);
  if (byWebsite) return byWebsite;
  const byName = [...clients.entries()].find(
    ([, c]) => c.name.toLowerCase() === String(ref).toLowerCase()
  );
  return byName ?? null;
}

function maskKeyValue(value) {
  const v = String(value);
  if (v.length <= 8) return "••••";
  return `${v.slice(0, 4)}••••${v.slice(-4)}`;
}

function clientSummaryText(clientId, client) {
  const keys = [...clientKeys.values()].filter(
    (k) => k.clientId === clientId && k.status === "active"
  );
  const purchased = [...creditPurchases.values()]
    .filter((p) => p.clientId === clientId)
    .reduce((sum, p) => sum + p.credits, 0);
  const used = [...agentUsage.values()]
    .filter((u) => u.clientId === clientId)
    .reduce((sum, u) => sum + u.credits, 0);
  return `${client.name} (${client.website}): ${keys.length} key(s), ${purchased} credits bought, ${used} used, ${purchased - used} remaining`;
}

export const registerClientTool = {
  name: "register_client",
  config: {
    title: "Register a client by website",
    description:
      "Register (or update) a client that you run AI agents for, keyed by their website. " +
      "Returns the client id that key, credit, and usage records reference.",
    inputSchema: {
      name: z.string().describe("Client or business name"),
      website: z.string().describe("Client's website, the stable identifier for this client"),
      notes: z.string().optional().describe("Any notes about the client or their agents"),
    },
  },
  async handler({ name, website, notes }) {
    const existingEntry = [...clients.entries()].find(([, c]) => c.website === website);
    if (existingEntry) {
      const [id, existing] = existingEntry;
      clients.set(id, {
        ...existing,
        name,
        notes: notes !== undefined ? notes : existing.notes,
      });
      return {
        content: [
          { type: "text", text: `✓ Client updated: ${name} (${website}) as ${id}.` },
        ],
      };
    }
    const id = newId("cli");
    clients.set(id, { name, website, notes: notes ?? null, createdAt: new Date().toISOString() });
    return {
      content: [
        { type: "text", text: `✓ Client registered: ${name} (${website}) as ${id}. Use this id for keys, credits, and usage.` },
      ],
    };
  },
};

export const addClientKeyTool = {
  name: "add_client_key",
  config: {
    title: "Record an installed API key for a client",
    description:
      "Record an API key installed for a client's AI model. The full key value is encrypted " +
      "(AES-256-GCM) and stored so the key can be verified or used later; a masked reference " +
      "(first/last 4 chars) plus provider, model, and a label are also kept for display. " +
      "Requires OPSKEEP_KEY_ENCRYPTION_SECRET (24+ characters) set on this MCP server. Note: " +
      "the raw key value is sent to this tool in this conversation, so anyone who can read this " +
      "chat log sees it at that point, independent of how it's stored afterward.",
    inputSchema: {
      clientRef: z.string().describe("Client id, website, or name from the registry"),
      provider: z.string().describe("Model provider, e.g. anthropic, openai, google"),
      model: z.string().optional().describe("Model this key unlocks, e.g. claude-sonnet-4-2025"),
      keyValue: z.string().describe("The actual key value; encrypted at rest, never echoed back after this call"),
      keyLabel: z.string().optional().describe("Human label for this key, e.g. 'production agent'"),
    },
  },
  async handler({ clientRef, provider, model, keyValue, keyLabel }) {
    const found = findClient(clientRef);
    if (!found) {
      return {
        isError: true,
        content: [{ type: "text", text: `No client found for "${clientRef}". Register the client by website first.` }],
      };
    }
    if (!keyVaultConfigured()) {
      return {
        isError: true,
        content: [{ type: "text", text: "Set OPSKEEP_KEY_ENCRYPTION_SECRET (24+ characters) on this MCP server before recording provider keys." }],
      };
    }
    const [clientId, client] = found;
    const id = newId("key");
    clientKeys.set(id, {
      clientId,
      provider,
      model: model ?? null,
      keyLabel: keyLabel ?? null,
      keyMask: maskKeyValue(keyValue),
      secret: encryptSecret(keyValue),
      status: "not_checked",
      lastValidatedAt: null,
      addedAt: new Date().toISOString(),
    });
    const verifyHint = isKnownProvider(provider)
      ? " Use verify_client_key to confirm it works before relying on it."
      : ` Verification isn't available for "${provider}" from here yet.`;
    return {
      content: [
        {
          type: "text",
          text: `✓ Key ${id} recorded and encrypted for ${client.name} (${client.website}): ${provider}${model ? ` ${model}` : ""}${keyLabel ? ` (${keyLabel})` : ""}. Stored mask: ${clientKeys.get(id).keyMask}.${verifyHint}`,
        },
      ],
    };
  },
};

export const verifyClientKeyTool = {
  name: "verify_client_key",
  config: {
    title: "Verify a recorded API key against its provider",
    description:
      "Make a minimal live request to the provider to confirm a recorded key still works. " +
      "Updates the key's status (connected / invalid / rate_limited) and never returns the key value.",
    inputSchema: {
      keyId: z.string().describe("The key id returned when the key was recorded"),
    },
  },
  async handler({ keyId }) {
    const key = clientKeys.get(keyId);
    if (!key) {
      return { isError: true, content: [{ type: "text", text: `No key found with ID ${keyId}.` }] };
    }
    if (!key.secret) {
      return {
        isError: true,
        content: [{ type: "text", text: `Key ${keyId} has no encrypted credential (it may predate encrypted storage). Add it again to enable verification.` }],
      };
    }
    let status;
    let detail = "";
    try {
      const apiKey = decryptSecret(key.secret);
      await verifyProviderKey(key.provider, apiKey);
      status = "connected";
    } catch (err) {
      status = /rate.?limit|429/i.test(err.message) ? "rate_limited" : "invalid";
      detail = ` (${err.message})`;
    }
    clientKeys.set(keyId, { ...key, status, lastValidatedAt: new Date().toISOString(), lastError: status === "connected" ? null : detail.trim() });
    return { content: [{ type: "text", text: `Key ${keyId}: ${status}${detail}.` }] };
  },
};

export const listClientKeysTool = {
  name: "list_client_keys",
  config: {
    title: "List API keys for a client",
    description: "List the recorded API keys for one client (or all clients), showing masked references only.",
    inputSchema: {
      clientRef: z.string().optional().describe("Client id, website, or name; omit for all clients"),
      status: z.enum(["active", "removed", "all"]).default("active").describe(
        "Filter by key status. \"active\" means not removed (connected, invalid, rate_limited, or not_checked)."
      ),
    },
  },
  async handler({ clientRef, status }) {
    let entries = [...clientKeys.entries()];
    if (clientRef) {
      const found = findClient(clientRef);
      if (!found) {
        return {
          isError: true,
          content: [{ type: "text", text: `No client found for "${clientRef}".` }],
        };
      }
      entries = entries.filter(([, k]) => k.clientId === found[0]);
    }
    entries = entries.filter(([, k]) => {
      if (status === "all") return true;
      if (status === "active") return k.status !== "removed";
      return k.status === status;
    });

    if (entries.length === 0) {
      return { content: [{ type: "text", text: "No keys recorded." }] };
    }
    const lines = entries.map(([id, k]) => {
      const c = clients.get(k.clientId);
      return `- ${id}: ${c ? c.website : k.clientId} - ${k.provider}${k.model ? ` ${k.model}` : ""}${k.keyLabel ? ` (${k.keyLabel})` : ""} mask ${k.keyMask} [${k.status}]`;
    });
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
};

export const removeClientKeyTool = {
  name: "remove_client_key",
  config: {
    title: "Remove a recorded API key",
    description: "Soft-remove a previously recorded key by its id.",
    inputSchema: {
      keyId: z.string().describe("The key id returned when the key was recorded"),
    },
  },
  async handler({ keyId }) {
    const key = clientKeys.get(keyId);
    if (!key) {
      return {
        isError: true,
        content: [{ type: "text", text: `No key found with ID ${keyId}.` }],
      };
    }
    const { secret, ...rest } = clientKeys.get(keyId);
    clientKeys.set(keyId, { ...rest, status: "removed" });
    return { content: [{ type: "text", text: `✓ Key ${keyId} removed from the registry.` }] };
  },
};

export const recordCreditPurchaseTool = {
  name: "record_credit_purchase",
  config: {
    title: "Record credits bought for a client",
    description:
      "Record a credit top-up a client bought for their agents. Amount and credit count must " +
      "be supplied by the caller; nothing is invented.",
    inputSchema: {
      clientRef: z.string().describe("Client id, website, or name from the registry"),
      credits: z.number().positive().describe("Number of credits (or USD) purchased"),
      amount: z.number().nonnegative().optional().describe("Invoice amount in the currency, for reference"),
      currency: z.string().default("USD").describe("Currency code for the amount"),
      ref: z.string().optional().describe("Purchase reference, e.g. invoice or receipt id"),
      date: z.string().optional().describe("ISO 8601 date, defaults to now"),
    },
  },
  async handler({ clientRef, credits, amount, currency, ref, date }) {
    const found = findClient(clientRef);
    if (!found) {
      return {
        isError: true,
        content: [{ type: "text", text: `No client found for "${clientRef}". Register the client by website first.` }],
      };
    }
    const [clientId, client] = found;
    const id = newId("cr");
    creditPurchases.set(id, {
      clientId,
      credits,
      amount,
      currency,
      ref: ref ?? null,
      date: date ?? new Date().toISOString(),
    });
    return {
      content: [
        {
          type: "text",
          text: `✓ ${credits} credits recorded for ${client.name} (${client.website})${amount ? `, reference amount ${amount} ${currency}` : ""}${ref ? ` (${ref})` : ""}.`,
        },
      ],
    };
  },
};

export const getClientBalanceTool = {
  name: "get_client_balance",
  config: {
    title: "Get a client's credit balance",
    description: "Current balance for one client: credits bought minus credits their agents have used.",
    inputSchema: {
      clientRef: z.string().describe("Client id, website, or name from the registry"),
    },
  },
  async handler({ clientRef }) {
    const found = findClient(clientRef);
    if (!found) {
      return {
        isError: true,
        content: [{ type: "text", text: `No client found for "${clientRef}".` }],
      };
    }
    const [clientId, client] = found;
    return {
      content: [{ type: "text", text: `Balance: ${clientSummaryText(clientId, client)}.` }],
    };
  },
};

export const recordAgentUsageTool = {
  name: "record_agent_usage",
  config: {
    title: "Record agent usage for a client",
    description:
      "Record what a client's agents actually used (credits burned) so spend can be reconciled " +
      "against their balance. Credit count must be supplied by the caller.",
    inputSchema: {
      clientRef: z.string().describe("Client id, website, or name from the registry"),
      credits: z.number().positive().describe("Credits used by the agent"),
      action: z.string().optional().describe("What the agent did, e.g. 'web research batch'"),
      date: z.string().optional().describe("ISO 8601 date, defaults to now"),
    },
  },
  async handler({ clientRef, credits, action, date }) {
    const found = findClient(clientRef);
    if (!found) {
      return {
        isError: true,
        content: [{ type: "text", text: `No client found for "${clientRef}". Register the client by website first.` }],
      };
    }
    const [clientId, client] = found;
    const id = newId("use");
    agentUsage.set(id, {
      clientId,
      credits,
      action: action ?? null,
      date: date ?? new Date().toISOString(),
    });
    return {
      content: [
        {
          type: "text",
          text: `✓ ${credits} credits recorded as used by ${client.name} (${client.website})${action ? ` - ${action}` : ""}.`,
        },
      ],
    };
  },
};

export const summarizeClientUsageTool = {
  name: "summarize_client_usage",
  config: {
    title: "Summarize keys, credits, and usage per client",
    description:
      "Per-client summary for the agent manager: how many keys each client has, credits bought, " +
      "credits used, and remaining balance, across all or one client.",
    inputSchema: {
      clientRef: z.string().optional().describe("Client id, website, or name; omit for all clients"),
    },
  },
  async handler({ clientRef }) {
    if (clientRef) {
      const found = findClient(clientRef);
      if (!found) {
        return {
          isError: true,
          content: [{ type: "text", text: `No client found for "${clientRef}".` }],
        };
      }
      return {
        content: [{ type: "text", text: `Summary: ${clientSummaryText(found[0], found[1])}.` }],
      };
    }

    if (clients.size === 0) {
      return { content: [{ type: "text", text: "No clients registered yet. Start with register_client." }] };
    }
    const lines = [...clients.entries()].map(([clientId, c]) =>
      clientSummaryText(clientId, c)
    );
    return { content: [{ type: "text", text: lines.join("\n") }] };
  },
};