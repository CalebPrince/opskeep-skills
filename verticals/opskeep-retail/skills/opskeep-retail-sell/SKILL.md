---
name: opskeep-retail-sell
description: "Use when the user wants Opskeep Retail to help with the sell moment: POS transaction status, in-store/online fulfillment sync, order handoff, exceptions like oversell or backorder, and, when the shop has turned on autonomous mode, completing a routine customer sale end-to-end."
metadata:
  lane: sell
  version: 0.1.0
---

# Opskeep Retail Sell

Keep the sale and fulfillment moving without silent exceptions.

## Use For

- Transaction/order status checks.
- In-store/online fulfillment sync and handoff.
- Flagging exceptions: oversell, backorder, channel mismatch.
- Completing a routine customer sale end-to-end when the shop has turned on autonomous
  mode for this lane, escalating instead of guessing when something falls outside it.

## References

- Load `references/sell.md` for the lane workflow.
- Load `references/autonomous-sale.md` when the shop has turned on
  `autonomous_with_escalation` for this lane.

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
- Default to holding every customer-facing message for approval. Only skip that hold when
  the shop has explicitly turned on `autonomous_with_escalation` for this lane (see
  `opskeep-retail-manage`); if that setting is unknown, treat it as off.
- On an escalation trigger in autonomous mode, route to `opskeep-escalate-to-owner`
  instead of guessing or proceeding.

## Gotchas

- Do not fabricate an order or transaction status. If it isn't connected or stated, it's
  `TBD`.
- An oversell or backorder is an exception to surface immediately, not something to
  smooth over in the summary.
- One shop location/channel is assumed by default; ask which one if multi-location or
  multi-channel context is present.
