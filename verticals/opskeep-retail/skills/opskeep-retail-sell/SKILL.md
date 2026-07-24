---
name: opskeep-retail-sell
description: "Use when the user wants Opskeep Retail to help with the sell moment: POS transaction status, in-store/online fulfillment sync, order handoff, and exceptions like oversell or backorder."
lane: sell
metadata:
  version: 0.1.0
---

# Opskeep Retail Sell

Keep the sale and fulfillment moving without silent exceptions.

## Use For

- Transaction/order status checks.
- In-store/online fulfillment sync and handoff.
- Flagging exceptions: oversell, backorder, channel mismatch.

## References

- Load `references/sell.md` for the lane workflow.

## Output Contract

- Transaction/order reference.
- Status (fulfilled, pending, exception).
- Exception flag and cause, if any.
- Next action and owner.
- Source/evidence or `TBD`.

## Boundaries

- Live POS/order reads or writes go through `opskeep-tools`/`composio-mcp` with discovery
  and schema checks. Do not claim live transaction access unless a connected tool was
  actually used.
- Pricing changes belong to `opskeep-retail-plan-drop`.
- Refunds, exchanges, and till reconciliation belong to `opskeep-retail-get-paid`.
- POS/channel connector setup goes to `opskeep-retail-manage`.

## Gotchas

- Do not fabricate an order or transaction status. If it isn't connected or stated, it's
  `TBD`.
- An oversell or backorder is an exception to surface immediately, not something to
  smooth over in the summary.
- One shop location/channel is assumed by default; ask which one if multi-location or
  multi-channel context is present.
