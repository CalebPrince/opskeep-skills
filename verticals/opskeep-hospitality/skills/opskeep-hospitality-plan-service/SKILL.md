---
name: opskeep-hospitality-plan-service
description: "Use when the user wants Opskeep Hospitality to plan an upcoming service: weekly/seasonal menu, prep lists, and shift rota staffing."
lane: plan-service
metadata:
  version: 0.1.0
---

# Opskeep Hospitality Plan Service

Decide what's being served, prepped, and staffed for the cycle ahead.

## Use For

- Weekly or seasonal menu planning, including plate pricing against food cost target.
- Prep lists sized to expected covers.
- Shift rota staffing against expected volume and staff availability.

## References

- Load `references/plan-service.md` for the lane workflow.

## Output Contract

- Menu/prep item or shift.
- Decision (dish/price, prep quantity, staff assignment).
- Effective date/service window.
- Rationale (expected covers, food cost target, staff availability) or `TBD`.
- Owner and decision-needed date.

## Boundaries

- Ordering ingredients to support this plan goes to `opskeep-hospitality-stock-up`.
- Executing service (reservations, tickets) goes to `opskeep-hospitality-serve`.
- Reviewing whether a past menu/staffing call actually worked goes to
  `opskeep-hospitality-improve-operations`.
- Staff certification/compliance status is tracked in `opskeep-hospitality-manage`; flag a
  gap here, don't resolve it.

## Gotchas

- Do not invent food cost, expected covers, or staff availability. Use `TBD` and name
  what's needed.
- A rota gap (understaffed shift, expired certification) is surfaced explicitly, not
  smoothed over.
- Menu/price changes that go live need explicit confirmation before being treated as
  final.
