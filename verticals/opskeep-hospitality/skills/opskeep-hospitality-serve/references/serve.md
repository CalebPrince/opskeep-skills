# Opskeep Hospitality Serve Reference

Use to produce a table/ticket status or a flagged exception, not a nightly-volume
narrative — that belongs to `opskeep-hospitality-improve-operations`.

## Starter Jobs

- Check the status of a specific reservation, table, or waitlist entry.
- Check kitchen ticket status and flag a bottleneck.
- Support order-taking, including an allergy/dietary flag or an out-of-stock dish.

## Required Inputs

- Table/reservation/ticket reference, or enough context to find it (party name,
  approximate time, table number).
- Current status, or `TBD` if not connected/known.
- Any allergy/dietary flag stated by the guest.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live POS/reservation-system status when
  connected. Verify connection before stating a status as current.
- `opskeep-hospitality-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: status check, waitlist communication, ticket status, or
   order-taking support.
2. Identify the table/reservation/ticket. Ask if genuinely ambiguous.
3. Pull current status if a connected source is available; otherwise mark `TBD` and say
   what's needed to confirm it.
4. If an exception exists (kitchen bottleneck, out-of-stock dish, allergy flag), name it
   explicitly, its likely cause, and the smallest next action (86 the dish, alert the
   kitchen, offer an alternative).
5. Return status plus next action; do not let a bottleneck or allergy flag pass silently
   into a "service running fine" summary.

## Output Shape

- `Table/reservation/ticket`: reference or description.
- `Status`: seated, waiting, ticket fired, ticket delayed.
- `Exception`: type and cause, if any.
- `Next action`: owner and what happens next.

## Rules

- Never state a table or ticket is ready/served without evidence from a connected source
  or the user's own statement.
- A kitchen bottleneck or allergy flag is always surfaced, never smoothed into "mostly
  fine."
- Route menu/pricing questions to `opskeep-hospitality-plan-service` and close-out/tip
  questions to `opskeep-hospitality-get-paid` rather than answering them here.
