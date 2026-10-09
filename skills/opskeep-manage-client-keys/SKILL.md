---
name: opskeep-manage-client-keys
description: "Use when the user runs AI agents for clients and needs the bookkeeping around them: register a client by their website and record which API keys are installed for that client's AI models, how many keys each client has, the credits each client bought or topped up, and what each client's agents actually use. Use for per-client key, credit/top-up, spend, and agent-usage records. Do not use for invoicing clients or chasing payments (that is opskeep-get-paid) or for generic tool/connector setup (that is opskeep-manage)."
metadata:
  lane: meta
  version: 0.1.0
---

# Manage Client Keys & Credits

Owns the per-client registry for the agent manager: which AI API keys are installed for a client, how many keys that client has, the credits they bought, and what their agents burn. A client is identified by their website.

## When to use

- Register a new client ("they're at oakst.example, set them up").
- Record which API keys are installed for a client's AI models.
- Count how many keys a client has, or which provider/model each unlocks.
- Record a credit top-up a client bought.
- Check a client's balance, or what their agents have used.
- Summarize the whole book: keys per client, credits bought, credits used, remaining.

## Workflow

1. **Identify the client.** Match by registered client id, website, or name. If the website is new, call `register_client` with the name and website first, and return the new client id.
2. **Key bookkeeping.** `add_client_key` records an installed key (provider, optional model, label); the value is encrypted at rest, not stored in the clear. Use `verify_client_key` to confirm a key actually works against its provider, `list_client_keys` to count them, and `remove_client_key` to soft-remove one (this also scrubs its stored credential). Never echo a key value back after it's recorded.
3. **Credit bookkeeping.** `record_credit_purchase` records credits bought. `get_client_balance` shows purchased minus used.
4. **Usage bookkeeping.** `record_agent_usage` records what a client's agents burned. Reconcile against the balance when asked.
5. **Summarize.** `summarize_client_usage` returns the per-client line: keys, credits bought, used, remaining.

## Output Contract

- **Client:** name and website (the stable identifier), plus client id when one exists.
- **Per client:** number of keys, credits bought, credits used, remaining balance.
- **Key records:** provider, model, label, and masked reference; the value itself is never echoed.
- **Unknowns:** missing websites, credit amounts, or usage figures are `TBD` or a prompt back to the user. Never invent a price, a credit count, or a usage figure.

## Boundaries

- Client money follow-through (invoices, chasing payment, budgets) stays `opskeep-get-paid`.
- Agent-side tool access and live external app writes stay `composio` / `opskeep-tools`.
- Ongoing client relationship touch stays `opskeep-keep-clients`.

## Gotchas

- API keys are encrypted at rest (`OPSKEEP_KEY_ENCRYPTION_SECRET` must be set on the MCP server, or `add_client_key` refuses to save) and never echoed or logged after the initial call. The raw value still passes through this conversation once, when it's given to `add_client_key` — say so if the user seems to assume otherwise.
- Confirmation gate before every write: registration, key adds/removes, credit purchases, and usage records all change the client's book.
- One client per website. A new website means a new client, even if the business name matches an existing one.
- Records survive server restarts: the MCP server persists to a JSON store (default `~/.opskeep/registry.json`, override with `OPSKEEP_STORE_FILE`). Keep one server instance per store file.