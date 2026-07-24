---
name: opskeep-tools
description: "Use when the user wants a standalone Opskeep utility or hosted capability: audio briefs, voice huddles, follow-up reminders, time tracking, job expense tracking, Composio/tool access, or future small Opskeep utilities."
lane: meta
metadata:
  version: 0.1.0
---

# Opskeep Tools

Route standalone utilities without turning them into business lanes.

## Tool Routes

- Audio/listenable/phone-friendly brief -> `opskeep-audio-brief`.
- Live voice conversation or huddle -> `opskeep-huddle-beta`.
- One-shot self-email reminder -> `opskeep-follow-up-reminders`.
- Start/stop/switch/backfill/update/archive/summarize time records -> `opskeep-time-tracking`.
- Log/list/summarize/delete a job-tagged expense (materials, mileage, other cost) -> `opskeep-expense-tracking`.
- Live external app access or writes -> `composio` with discovery/schema-safe execution.

## Output Contract

- Selected tool.
- Why this is a utility instead of a business lane.
- Required inputs and blockers.
- Confirmation gate before external writes, publishing, reminders, huddles, or time-record/expense-record changes.
- Source/provenance when connected tools are used.

## Boundaries

- Business outcome requests route to the six business lane skills first.
- Tool setup, connectors, automations, and company brain configuration go to `opskeep-manage`.

## Gotchas

- `brief this` is not an audio brief unless audio/listenable/spoken/phone-friendly wording is explicit.
- `talk through` is not a voice huddle unless live voice wording is explicit.
- External writes, published audio pages, reminders, huddles, and time-record/expense-record changes require the destination skill's confirmation gate.
