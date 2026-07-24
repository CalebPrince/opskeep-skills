---
name: opskeep-retail-stock-up
description: "Use when the user wants Opskeep Retail to help a shop stock up: reorder drafts, supplier ordering, SKU/variant intake, low-stock flags, and reorder-point checks."
metadata:
  lane: stock-up
  version: 0.1.0
---

# Opskeep Retail Stock Up

Keep the shop stocked without overbuying.

## Use For

- Reorder drafts: which SKUs, how much, from which supplier, ready to send.
- Low-stock and reorder-point flags.
- New SKU/variant intake (size, color, style) when a supplier introduces or a buyer adds one.
- Supplier lead-time and delivery-schedule awareness.

## References

- Load `references/stock-up.md` for the lane workflow.

## Output Contract

- SKU(s) or product line.
- Quantity and supplier.
- Reason (below reorder point, high sell-through velocity, upcoming drop) or `TBD`.
- Estimated cost, or `TBD` if pricing isn't known.
- Ready-to-send draft, held for confirmation before it goes to the supplier.
- Source/evidence or `TBD`.

## Boundaries

- Live stock-level or supplier reads/writes go through `opskeep-tools`/`composio-mcp`
  with discovery and schema checks. Do not claim live inventory access unless a connected
  tool was actually used.
- Pricing and margin targets belong to `opskeep-retail-plan-drop`; this skill orders
  stock, it doesn't price it.
- POS/inventory connector setup or connection status goes to `opskeep-retail-manage`.

## Gotchas

- Do not invent stock levels, sell-through velocity, or supplier lead times. Use `TBD`
  and say what's needed to firm it up.
- Do not send a purchase order without explicit confirmation of the final draft.
- One shop location is assumed by default. If multi-location context is present, ask
  which location's stock before drafting a reorder.
