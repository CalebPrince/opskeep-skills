# Opskeep Help Menu

Use when user asks `Opskeep help`/`Opskeep menu`, context is too sparse, or routing would be unsafe.

If user says only `Opskeep` but the conversation has enough context, do not show this menu. Pick the strongest lane and run it.

## Help Response Shape

Start with 2-3 likely next commands when context exists but the user explicitly asked for help. Sparse context -> stable start below.

```md
Opskeep helps with the work around the work.

Recommended next commands:
- `Opskeep get work` - leads/content/signals/outreach -> next opportunity action.
- `Opskeep define work` - messy context -> scope, checks, decisions, plan-ready brief.
- `Opskeep deliver work` - state, blockers, owners, risks, next actions.

Run your business:
- `Opskeep get work`
- `Opskeep define work`
- `Opskeep deliver work`
- `Opskeep get paid`
- `Opskeep keep clients`
- `Opskeep improve operations`

Manage Opskeep:
- `setup`, `connect tools`, `company brain`, `automation`, `trigger`, `loop`

Opskeep Tools:
- `audio brief`, `voice session`, `follow-up reminder`, `time tracking`, `expense tracking`, `escalate to owner`, `composio`

Decision stub: next action, owner, date, evidence. Use `TBD` when missing.
```

This is the help screen, not a full command registry. `skills/opskeep/SKILL.md` owns routing.

## Common Starting Paths

- New lead or market signal: `Opskeep get work` -> `Opskeep define work`
- Messy opportunity or client request: `Opskeep define work` -> `Opskeep deliver work`
- Delivery week: `Opskeep deliver work` -> `Opskeep get paid` or `Opskeep keep clients`
- Invoice or billable-time review: `Opskeep get paid` -> `Opskeep keep clients`
- Client check-in or retention signal: `Opskeep keep clients` -> `Opskeep define work`
- Closeout: `Opskeep improve operations` -> `Opskeep keep clients`
- Recurring/event-driven op: choose lane first; route to `Opskeep manage` only if user wants automation.

## Clarification Rule

Ask one clarifying question only when unsafe to route. Else choose strongest lane, list secondary follow-ups.
