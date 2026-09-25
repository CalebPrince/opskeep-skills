# Opskeep MCP server

An MCP server exposing Opskeep's hosted tools as callable functions: client update
delivery, reminders, session recaps, time and expense tracking, and owner escalations.
This is the mechanical,
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

## Status

This is a **scaffold**, not production infra. Reminders, recaps, time entries, and
escalations are held in memory (see `src/store.js`) and reset on restart. Email/Slack
delivery, TTS generation, and owner escalation notifications are stubbed with `TODO`
comments marking where a real provider goes. The tool contracts (names, input schemas,
response shape) are the stable part: build against those.

## Install & run

```bash
cd mcp-server
npm install
npm start
```

The server speaks MCP over stdio.

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
