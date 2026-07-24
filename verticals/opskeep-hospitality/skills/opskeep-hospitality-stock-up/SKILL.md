---
name: opskeep-hospitality-stock-up
description: "Use when the user wants Opskeep Hospitality to help a restaurant/venue stock up: ingredient ordering, par levels, supplier delivery reconciliation, and low-stock flags."
lane: stock-up
metadata:
  version: 0.1.0
---

# Opskeep Hospitality Stock Up

Keep the kitchen stocked to plan without over-ordering perishables.

## Use For

- Purchase order drafts sized to par levels and upcoming service volume.
- Reconciling a delivery against its invoice (short-ships, substitutions, price changes).
- Low-stock/par-level flags for ingredients needed this cycle.

## References

- Load `references/stock-up.md` for the lane workflow.

## Output Contract

- Ingredient(s) or supplier order.
- Quantity and supplier.
- Reason (below par level, upcoming service volume, delivery discrepancy) or `TBD`.
- Estimated cost, or `TBD` if pricing isn't known.
- Ready-to-send draft, held for confirmation before it goes to the supplier.
- Any temperature/quality flag surfaced from a delivery check.
- Source/evidence or `TBD`.

## Boundaries

- Live stock-level or supplier reads/writes go through `opskeep-tools`/`composio-mcp`
  with discovery and schema checks. Do not claim live inventory access unless a connected
  tool was actually used.
- Menu/pricing decisions belong to `opskeep-hospitality-plan-service`; this skill orders
  ingredients, it doesn't decide what's on the menu.
- POS/inventory connector setup goes to `opskeep-hospitality-manage`.
- Food-safety flags (temperature excursion, damaged delivery, allergen labeling gap) are
  surfaced immediately as part of normal output, never held back or resolved here — say
  what was observed and that it needs venue policy/a qualified professional.

## Gotchas

- Do not invent stock levels, par levels, or supplier lead times. Use `TBD` and say what's
  needed to firm it up.
- Do not send a purchase order without explicit confirmation of the final draft.
- A delivery discrepancy (short-ship, substitution, temperature issue) is always
  surfaced, never smoothed into a "delivery received fine" summary.
- One venue is assumed by default. If multi-location context is present, ask which
  location's stock before drafting an order.
