# Opskeep admin dashboard

A local web dashboard for the person running AI agents for clients: register clients by
website, install and verify their provider API keys, set per-model pricing, top up and
track credit balances, and queue or watch agent runs. It reads and writes the same JSON
store as the [`mcp-server`](../mcp-server) package (`opskeep-tools`), so the dashboard and
the `opskeep-manage-client-keys` MCP tools stay in sync automatically when pointed at the
same file.

## Install & run

```bash
cd admin
npm install
npm start
```

Opens on `http://127.0.0.1:8377` by default (local-only). On first run, if you haven't set
`OPSKEEP_ADMIN_PASSWORD`, a random login password is printed to the console — copy it from
there.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPSKEEP_ADMIN_USERNAME` | `owner` | Login username. |
| `OPSKEEP_ADMIN_PASSWORD` | random, printed at startup | Login password, until changed from Settings (see below) — after that, the stored password takes over and this variable is ignored. |
| `OPSKEEP_ADMIN_SECRET` | random per boot | Signs session cookies. Set a fixed value if you want sessions to survive a restart. |
| `OPSKEEP_ADMIN_PORT` | `8377` | Port to listen on. |
| `OPSKEEP_ADMIN_HOST` | `127.0.0.1` | Bind address (local-only by default). |
| `OPSKEEP_STORE_FILE` | `~/.opskeep/registry.json` | Shared JSON store, same default and variable name as [`mcp-server`](../mcp-server#persistence). Point both at the same path to share one client/key/credit registry. |
| `OPSKEEP_KEY_ENCRYPTION_SECRET` | none | **Required** (24+ characters) before saving a provider key. Encrypts keys at rest (AES-256-GCM, see [`secrets.js`](secrets.js)). Use the same value here and on the MCP server if both write to the same store file, so either side can decrypt a key the other recorded. |
| `OPSKEEP_AGENT_RUNNER` | none | Optional external agent runner command. If unset, a "Run live now" run is executed in-process with automatic failover across the client's connected keys (see [`providers.js`](providers.js)) instead of staying queued for manual completion. |

## What it does

- **Clients** — one record per website: name, notes, optional spending limit, and a
  running credit balance (purchased minus used).
- **API keys** — added through provider/model pickers (`GET /api/providers`, catalog in
  [`providers.js`](providers.js)), encrypted at rest, never returned to the browser after
  save. "Save and verify" makes a live request to the provider immediately; a per-key
  "Verify" and "Rotate" action are available afterward. Removing a key scrubs its stored
  credential.
- **Pricing** — a per-model USD rate (`$ / 1M input tokens`, `$ / 1M output tokens`) you
  set yourself from the Pricing tab, since the model catalog isn't something this project
  can safely guess live rates for. One credit equals one USD.
- **Agent runs** — queue a task against a client, optionally checking "Run live now". A
  live run with no external runner requires the client to have **at least 3 keys verified
  as "connected"**; it tries them in the order they were added (any mix of providers/
  models), retrying transient errors (429/5xx/timeouts) on each key before moving to the
  next one, so one revoked or rate-limited key doesn't fail the run. Once the model that
  succeeded has a pricing rate set, the resulting token cost is booked as usage
  automatically; without a rate, the run still completes and booking its usage stays a
  manual "Book usage" step. Queuing without "Run live now" checked skips all of this and
  just files the task for manual completion, same as before.
- **Spending limits** — an optional per-client cap (independent of purchased balance);
  runs are blocked once it's reached.
- **Settings** — change the login password (scrypt-hashed in the store, see
  [`auth.js`](auth.js)); requires the current password and takes over from
  `OPSKEEP_ADMIN_PASSWORD` immediately. Existing signed-in sessions keep working — a
  password change doesn't force a re-login on this or other devices.

## API surface

All routes below require a signed-in session except `/api/login`.

| Route | Does |
| --- | --- |
| `GET /api/me` | Current session, runner status, vault status |
| `POST /api/login` / `POST /api/logout` | Session auth |
| `POST /api/settings/password` | Change the login password |
| `GET/POST /api/clients`, `GET/PATCH /api/clients/:id` | Client CRUD |
| `GET /api/providers` | Provider/model catalog for the key-add pickers |
| `POST /api/clients/:id/keys` | Add a key (encrypted) |
| `POST /api/clients/:id/keys/:keyId/verify` | Live-verify a key |
| `POST /api/clients/:id/keys/:keyId/rotate` | Replace a key's value in place |
| `DELETE /api/clients/:id/keys/:keyId` | Soft-remove a key and scrub its secret |
| `GET/PUT/DELETE /api/pricing[/:provider/:model]` | Read or set per-model rates |
| `POST /api/clients/:id/purchases` | Record a credit top-up |
| `POST /api/clients/:id/usage` | Record usage manually |
| `GET/POST /api/agents/runs`, `POST /api/agents/runs/:id/{complete,cancel}` | Queue, run, and reconcile agent runs |

## Related

- [`mcp-server`](../mcp-server) — the `opskeep-manage-client-keys` MCP tools
  (`register_client`, `add_client_key`, `verify_client_key`, `list_client_keys`,
  `remove_client_key`, credit/usage recording) that read and write this same store from an
  agent conversation instead of the browser.
- [`skills/opskeep-manage-client-keys`](../skills/opskeep-manage-client-keys) — the skill
  that teaches an agent how to use those MCP tools.
- Repo root [README.md](../README.md) — full skill pack and install instructions.

## Not built yet

- No per-model pricing ships by default (see above) — this is intentional, not an
  oversight, since the catalog includes forward-looking model names this project has no
  way to verify current rates for.
- No live verification (or run execution) for providers outside openai/anthropic/google/groq/deepseek/openrouter; other provider names can still be recorded, just not verified or run from here. Retry/backoff applies to any provider's run once it's supported.
- The 3-key failover chain only applies to the built-in in-process runner. If
  `OPSKEEP_AGENT_RUNNER` is set, only the first connected key is passed to it — extending
  that external protocol for multi-key failover is a separate, larger change.
- No manual control over which keys participate in a live run's failover chain, or their
  order beyond "oldest verified first" — it's always all of a client's currently
  "connected" keys.
- No UI for editing a client's name/website/notes after creation (only spending limit);
  use `PATCH /api/clients/:id` directly if needed.
