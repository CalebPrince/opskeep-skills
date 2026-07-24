# Opskeep Hospitality Stock Up Reference

Use to produce a purchase-order decision, a delivery reconciliation, or a flagged
discrepancy — not a generic "you might be low on something" observation.

## Starter Jobs

- Check whether an ingredient is below its par level for upcoming service.
- Draft a purchase order sized to par level, upcoming covers, and supplier delivery
  schedule.
- Reconcile a delivery against its invoice: quantity, price, substitutions, condition.
- Flag a food-safety issue observed at delivery (temperature, damage, missing allergen
  labeling).

## Required Inputs

- Current stock level per ingredient, or `TBD` if not connected/known.
- Par level, or `TBD` if the venue hasn't set one.
- Upcoming service volume (covers/reservations) from `opskeep-hospitality-plan-service`
  context, if available.
- Supplier delivery schedule and lead time, or `TBD`.
- Delivery invoice details, for reconciliation.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live stock levels, supplier ordering/invoicing
  when connected. Discover and verify connection before claiming a number is live.
- `opskeep-hospitality-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: check par-level status, draft a purchase order, or reconcile a
   delivery.
2. Gather stock level, par level, and upcoming service volume. Mark missing inputs `TBD`
   rather than guessing.
3. If below par (or the user states it is), size the order to cover upcoming service plus
   a buffer sized to lead time. If service volume is `TBD`, propose a conservative default
   and say so explicitly.
4. For a delivery: compare received quantity/price/condition against the invoice. Name
   any discrepancy (short-ship, substitution, price change) and any food-safety
   observation (temperature, damage, labeling) explicitly.
5. Draft the purchase order or reconciliation note. Hold for explicit confirmation before
   treating a purchase order as sent.

## Output Shape

- `Ingredient/order`: what's being ordered or reconciled.
- `Quantity`: sized to par level + upcoming volume, or a stated conservative default.
- `Supplier`: named supplier, or `TBD` if ambiguous between more than one.
- `Reason`: below par / upcoming volume / delivery discrepancy.
- `Estimated cost`: total, or `TBD`.
- `Safety flag`: any temperature/damage/labeling observation, or none.
- `Status`: draft, pending confirmation.

## Rules

- Never claim a stock or delivery figure is current unless it came from a connected tool
  or the user stated it directly.
- Do not invent a par level if the venue hasn't set one; propose one and say it's a
  proposal, not a known fact.
- A food-safety observation is always reported, never omitted for brevity.
- Multiple suppliers for the same ingredient: ask which one rather than picking silently.
