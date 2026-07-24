# Opskeep Retail Stock Up Reference

Use to produce a reorder decision or draft, not a generic "you might be low on stock"
observation.

## Starter Jobs

- Check whether a SKU or product line is below its reorder point.
- Draft a purchase order for one or more SKUs, sized to sell-through velocity and
  supplier lead time.
- Log a new SKU/variant intake (size, color, style).
- Flag stock that's likely to run out before the next scheduled delivery.

## Required Inputs

- Current stock level per SKU, or `TBD` if not connected/known.
- Sell-through velocity (units/week or similar), or `TBD`.
- Supplier lead time and next scheduled delivery, or `TBD`.
- Reorder point/target stock level if the shop has set one, or `TBD`.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live stock levels, POS sales history, supplier
  catalogs/ordering when connected. Discover and verify connection before claiming a
  number is live.
- `opskeep-retail-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: check reorder status, or draft a purchase order.
2. Gather stock level, velocity, and lead time for the SKU(s) in question. Mark any
   missing input `TBD` rather than guessing.
3. If below reorder point (or the user states it is), size the reorder: enough to cover
   sell-through through the next delivery cycle plus a buffer, using known velocity. If
   velocity is `TBD`, propose a conservative default quantity and say so explicitly.
4. Draft the purchase order: SKU, quantity, unit cost estimate, supplier, total.
5. Hold for explicit confirmation before treating it as sent.

## Output Shape

- `SKU/product line`: what's being reordered.
- `Quantity`: sized to velocity + lead time, or a stated conservative default.
- `Supplier`: named supplier, or `TBD` if ambiguous between more than one.
- `Reason`: below reorder point / high velocity / upcoming drop.
- `Estimated cost`: total, or `TBD`.
- `Status`: draft, pending confirmation.

## Rules

- Never claim a stock number is current unless it came from a connected tool or the
  user stated it directly.
- Do not invent a reorder point if the shop hasn't set one; propose one and say it's a
  proposal, not a known fact.
- Multiple suppliers for the same SKU: ask which one rather than picking silently.
