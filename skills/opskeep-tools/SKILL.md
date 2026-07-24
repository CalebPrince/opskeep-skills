---
name: opskeep-tools
description: Routes standalone hosted utilities: session recaps, follow-up reminders, and time tracking, when requested outside the context of a specific business lane.
lane: meta
---

# Opskeep tools

Covers the hosted utilities that are useful on their own, not just as part of a lane
workflow. These are the Pro-tier hosted tools referenced in the product surfaces (see
[PRODUCT.md](../../PRODUCT.md)).

The actual sending, scheduling, and storing happens through the Opskeep MCP server (see
[mcp-server](../../mcp-server)). This skill decides *when* and *what* to call; the MCP
server does the mechanical work.

| Request | MCP tool |
| --- | --- |
| Deliver a client update | `send_client_update` |
| Schedule a one-time reminder | `schedule_reminder` |
| Cancel a reminder | `cancel_reminder` |
| Create a session recap | `create_session_recap` |
| Start/stop a timer | `start_timer` / `stop_timer` |
| Backfill a time entry | `backfill_time_entry` |
| Summarize logged time | `summarize_time` |

## When to trigger

- "Turn this session into an audio recap."
- "Remind me by email tomorrow at 9am to send that invoice."
- "Start a timer for [project]." / "Stop the timer." / "How much time did I log this week?"

## What to gather

- For recaps: the source material (session, doc, PR, URL) and desired length/format.
- For reminders: exact trigger time, timezone, and the message content; reminders are
  one-shot and deterministic, never inferred to repeat unless explicitly asked.
- For time tracking: project/client to attribute the entry to.

## What to produce

- A recap artifact with a shareable listening link.
- A confirmed one-time reminder with the exact send time restated back to the user.
- A time entry (start/stop/backfill) with project attribution and a running total on
  request.

## Handoffs

- A reminder is really about invoice follow-up → `opskeep-get-paid` may want to log the
  same follow-up as a money-tracking item, not just a personal reminder.
- Time logged against a project feeds `opskeep-get-paid` budget/margin checks.

## Guardrails

- Reminders are one-shot only from this skill. A request for a recurring nudge belongs in
  `opskeep-manage` as an automation, with explicit confirmation before it's created.
