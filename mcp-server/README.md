# Opskeep MCP server

An MCP server exposing Opskeep's hosted tools as callable functions: client update
delivery, reminders, session recaps, time and expense tracking, owner escalations, and
per-client key/credit/usage bookkeeping for the agent manager. This is the mechanical,
stateful half of `opskeep-tools`: the judgment (what to write, when to check in) stays in
the skill; this server does the sending, scheduling, and storing.

## Tools

| Tool | Does |
| --- | --- |
| `send_client_update` | Delivers an already-composed update via email or Slack |
| `schedule_reminder` | Schedules a one-time future email reminder |
| `cancel_reminder` | Cancels a scheduled reminder by ID |
| `schedule_recurring_reminder` | Creates a recurring (daily/weekly/monthly) email reminder rule |
| `cancel_recurring_reminder` | Cancels a recurring reminder rule by ID |
| `list_recurring_reminders` | Lists recurring reminder rules, optionally by status |
| `create_session_recap` | Turns source text into a recap artifact with a listen link |
| `start_timer` / `stop_timer` | Starts/stops a running timer for a project |
| `backfill_time_entry` | Logs a completed time block without a live timer |
| `summarize_time` | Totals logged time for a project, optionally since a date |
| `log_expense` | Logs a materials/mileage/other cost tagged to a job |
| `list_expenses` | Lists logged expenses, optionally by job and/or category |
| `summarize_expenses` | Totals a job's expenses by category, ready to fold into an invoice |
| `delete_expense` | Removes a logged expense by ID |
| `escalate_to_owner` | Pauses an autonomous transaction and records an escalation for the business owner |
| `resolve_escalation` | Records how a paused escalation was resolved |
| `list_escalations` | Lists escalations, optionally by status |
| `register_client` | Registers or updates a client by their website (the stable id) |
| `add_client_key` | Records an API key installed for a client's AI model, encrypted at rest |
| `verify_client_key` | Makes a live request to confirm a recorded key still works |
| `list_client_keys` | Lists a client's recorded keys (masked references), optionally by status |
| `remove_client_key` | Soft-removes a recorded key by ID and scrubs its stored credential |
| `record_credit_purchase` | Records credits a client bought / topped up |
| `get_client_balance` | Credits bought minus credits used, for one client |
| `record_agent_usage` | Records what a client's agents used (credits burned) |
| `summarize_client_usage` | Per-client book: keys, credits bought, used, remaining |
| `video_list_projects` / `video_get_project` | Reads projects in Video Studio (outputs, content files, voice lines) |
| `video_create_project` / `video_update_project` | Creates a project from the owner's template, renames it or sets its voice |
| `video_read_file` / `video_write_file` | Reads or replaces one of five content files (`index.html`, `audio.json`, `clips.json`, `icons.json`, `notes.md`); never a script |
| `video_set_script_lines` | Replaces the voice lines; changed lines are set aside for re-voicing |
| `video_request_voice_lines` | Requests paid voicing; waits for the owner's approval in the studio |
| `video_queue_job` / `video_get_job_status` | Queues an unpaid pipeline step and reads job or queue status |
| `video_list_outputs` / `video_get_review_comments` | Lists rendered files and the owner's timed review comments |

## Video Studio tools

The `video_*` tools call the Video Studio server on the same PC (`D:\Websites\video-studio`) with an agent token. The studio enforces the scope: the agent token cannot approve paid jobs, review, delete, download, change settings or write anything except the five content files, so there are deliberately no tools for those here. Comments, file contents and logs come back labelled as untrusted data. These tools are free (not metered).

| Variable | Default | Purpose |
| --- | --- | --- |
| `VIDEO_STUDIO_TOKEN` | none | Agent token issued in the studio under Settings (shown once). Without it the `video_*` tools return a plain error and the other tools are unaffected. |
| `VIDEO_STUDIO_URL` | `http://127.0.0.1:4400` | Where the studio listens. Loopback addresses only; anything else is refused so the token never leaves the PC. |

## Persistence

All tool records (reminders, recaps, time entries, expenses, escalations, and the client
registry) live in a JSON file and survive server restarts:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPSKEEP_STORE_FILE` | `~/.opskeep/registry.json` | Where the store is saved (and loaded from). Set it to share a registry across machines via a synced path, or to keep the file out of a user's home. |
| `OPSKEEP_KEY_ENCRYPTION_SECRET` | none | Required (24+ characters) before `add_client_key` will save a key. Encrypts recorded provider keys at rest (AES-256-GCM). Use the **same** value here and on any admin dashboard sharing this store file, so either side can decrypt keys the other recorded. |

Writes are atomic (temp file + rename), and the id counter is persisted too, so new records
never collide with ones already on disk. Run **one server instance per store file**; two
processes writing the same file can drop each other's updates.

The "Which tools cost credits" behavior below is independent of storage: metering gates
billable actions only, regardless of where records are kept.

## Status

The server keeps its records in a **file-backed store** that survives restarts, so
multi-session use keeps its data. Every mutating call is written atomically (temp file +
rename) to a single JSON file. Default location is `~/.opskeep/registry.json`; point it
elsewhere with the `OPSKEEP_STORE_FILE` environment variable. One server instance should
own a given file.

Email/Slack delivery, TTS generation, and owner escalation notifications are still stubbed
with `TODO` comments marking where a real provider goes. The tool contracts (names, input
schemas, response shape) are the stable part: build against those.

The client registry stores recorded provider keys encrypted at rest (AES-256-GCM, see
`src/secrets.js`), alongside a masked display reference (first/last 4 characters). The
raw key value still passes through this conversation once, when `add_client_key` is
called — that's unavoidable for any tool that accepts a secret as an argument — but it is
never echoed back afterward, and `remove_client_key` scrubs the stored credential. Set
`OPSKEEP_KEY_ENCRYPTION_SECRET` before recording keys; without it, `add_client_key` refuses
to save.

## Install & run

```bash
cd mcp-server
npm install
npm start
```

The server speaks MCP over stdio.

## Related

- [`admin`](../admin) — a local web dashboard over this same store file (registry, key
  encryption, provider verification, pricing, and agent runs) for the person who'd rather
  click through a UI than call these tools from a conversation.
- [`skills/opskeep-manage-client-keys`](../skills/opskeep-manage-client-keys) — the skill
  that teaches an agent when and how to call the client-key/credit/usage tools above.

## Connect it to an agent

Most MCP-compatible agents (Claude Code, Claude Desktop, Cursor, etc.) take a JSON config
pointing at the command to launch the server. Example:

```json
{
  "mcpServers": {
    "opskeep-tools": {
      "command": "node",
      "args": ["/absolute/path/to/opskeep-skills/mcp-server/src/index.js"]
    }
  }
}
```

For Claude Code specifically:

```bash
claude mcp add opskeep-tools -- node /absolute/path/to/opskeep-skills/mcp-server/src/index.js
```

Once connected, the `opskeep-tools` skill (see `../skills/opskeep-tools/SKILL.md`) tells
the agent when to call each tool.

## Usage metering (optional)

For the hosted Opskeep product, billable tool calls draw down a customer's credit balance
in the Opskeep admin server. **This is entirely optional and off by default** — the pack
runs standalone, and metering only activates when all of the required environment variables
are set. When off, `meterTool` returns each tool untouched (zero overhead, no network
calls), so open-source users are unaffected.

Enable it by launching the server with:

| Variable | Purpose |
| --- | --- |
| `OPSKEEP_ADMIN_URL` | Base URL of the admin server, e.g. `https://admin.opskeep.com` |
| `OPSKEEP_USAGE_API_KEY` | The admin server's `OPSKEEP_USAGE_API_KEY` (machine key) |
| `OPSKEEP_CUSTOMER_ID` *(or `OPSKEEP_CUSTOMER_EMAIL`)* | Which customer this instance bills |

Optional tuning:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPSKEEP_METERING_FAIL_OPEN` | `1` | If the billing server is unreachable, allow the action (`1`) or refuse it (`0`) |
| `OPSKEEP_METERING_TIMEOUT_MS` | `5000` | Per-charge request timeout |

Because each customer bills to their own balance, run **one server instance per customer**,
with that customer's `OPSKEEP_CUSTOMER_ID` in its launch config. Example agent config:

```json
{
  "mcpServers": {
    "opskeep-tools": {
      "command": "node",
      "args": ["/absolute/path/to/opskeep-skills/mcp-server/src/index.js"],
      "env": {
        "OPSKEEP_ADMIN_URL": "https://admin.opskeep.com",
        "OPSKEEP_USAGE_API_KEY": "…",
        "OPSKEEP_CUSTOMER_ID": "42"
      }
    }
  }
}
```

**Which tools cost credits:** the outbound / generative actions — `send_client_update`,
`schedule_reminder`, `schedule_recurring_reminder`, `create_session_recap`, and
`escalate_to_owner` (see `BILLABLE_ACTIONS` in `src/index.js`). Cancels, reads, and local
time/expense bookkeeping run free. The per-action **prices** live on the admin side
(`admin/server/pricing.js`), so this server never hardcodes credit amounts.

**Behavior:** a billable call charges *before* running, so an out-of-credits (`402`) or
cancelled (`403`) customer is refused before any work happens and the balance never goes
negative. Charges are idempotent per call (a UUID `eventId`), so an SDK retry won't
double-bill.
