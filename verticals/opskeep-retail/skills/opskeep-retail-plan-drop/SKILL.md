---
name: opskeep-retail-plan-drop
description: "Use when the user wants Opskeep Retail to plan what the shop sells this cycle: pricing, merchandising calendar, seasonal launches, and markdown timing decisions."
lane: plan-drop
metadata:
  version: 0.1.0
---

# Opskeep Retail Plan The Drop

Decide what's being sold, at what price, and when.

## Use For

- Pricing a new SKU or product line against a target margin.
- Seasonal launch/drop calendars.
- Markdown timing decisions (when, how much, on what).
- Merchandising plan for an upcoming cycle (what's featured, what's phased out).

## References

- Load `references/plan-drop.md` for the lane workflow.

## Output Contract

- SKU/product line or collection.
- Price or markdown decision, with target margin shown.
- Launch/effective date.
- Rationale (prior sell-through, season, cost basis) or `TBD`.
- Owner and decision-needed date.

## Boundaries

- Ordering the stock to support this plan goes to `opskeep-retail-stock-up`.
- Executing the sale (transactions, fulfillment) goes to `opskeep-retail-sell`.
- Reviewing whether a past pricing/markdown call actually worked goes to
  `opskeep-retail-improve-operations`.
- POS/merchandising connector setup goes to `opskeep-retail-manage`.

## Gotchas

- Do not invent cost basis, prior sell-through, or margin figures. Use `TBD` and name
  what's needed.
- A markdown decision needs a reason (aging stock, season end, target margin already met)
  — don't propose one without one.
- Pricing changes that go live need explicit confirmation before being treated as final.
