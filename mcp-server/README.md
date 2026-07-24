# Opskeep MCP server

An MCP server exposing Opskeep's hosted tools as callable functions: client update
delivery, one-time reminders, session recaps, and time tracking. This is the mechanical,
stateful half of `opskeep-tools`: the judgment (what to write, when to check in) stays in
the skill; this server does the sending, scheduling, and storing.

## Tools

| Tool | Does |
| --- | --- |
| `send_client_update` | Delivers an already-composed update via email or Slack |
| `schedule_reminder` | Schedules a one-time future email reminder |
| `cancel_reminder` | Cancels a scheduled reminder by ID |
| `create_session_recap` | Turns source text into a recap artifact with a listen link |
| `start_timer` / `stop_timer` | Starts/stops a running timer for a project |
| `backfill_time_entry` | Logs a completed time block without a live timer |
| `summarize_time` | Totals logged time for a project, optionally since a date |

## Status

This is a **scaffold**, not production infra. Reminders, recaps, and time entries are
held in memory (see `src/store.js`) and reset on restart. Email/Slack delivery and
TTS generation are stubbed with `TODO` comments marking where a real provider goes.
The tool contracts (names, input schemas, response shape) are the stable part: build
against those.

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
