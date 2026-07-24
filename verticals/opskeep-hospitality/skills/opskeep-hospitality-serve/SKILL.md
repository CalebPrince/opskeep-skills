---
name: opskeep-hospitality-serve
description: "Use when the user wants Opskeep Hospitality to help with the serve moment: reservation/table status, waitlist, kitchen ticket execution, and order-taking."
lane: serve
metadata:
  version: 0.1.0
---

# Opskeep Hospitality Serve

Keep tables, tickets, and the waitlist moving without silent bottlenecks.

## Use For

- Reservation/table status checks and waitlist communication.
- Kitchen ticket status and bottleneck flags.
- Order-taking support and exceptions (wrong item, allergy flag, out-of-stock dish).

## References

- Load `references/serve.md` for the lane workflow.

## Output Contract

- Table/reservation/ticket reference.
- Status (seated, waiting, ticket fired, ticket delayed).
- Exception flag and cause, if any (bottleneck, allergy, out-of-stock item).
- Next action and owner.
- Source/evidence or `TBD`.

## Boundaries

- Live POS/reservation reads or writes go through `opskeep-tools`/`composio-mcp` with
  discovery and schema checks. Do not claim live table/order access unless a connected
  tool was actually used.
- Menu/pricing changes belong to `opskeep-hospitality-plan-service`.
- Close-out, tips, and reconciliation belong to `opskeep-hospitality-get-paid`.
- POS/reservation connector setup goes to `opskeep-hospitality-manage`.
- An allergen flag on an order is surfaced immediately as part of normal output, never
  smoothed over or resolved by guessing — confirm with the kitchen/venue policy.

## Gotchas

- Do not fabricate a table, reservation, or ticket status. If it isn't connected or
  stated, it's `TBD`.
- A kitchen bottleneck or out-of-stock dish is an exception to surface immediately, not
  something to smooth over in the summary.
- One venue and one continuous service is assumed by default; ask which one if daypart or
  multi-location context is present.
