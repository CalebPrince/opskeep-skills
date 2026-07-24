---
name: opskeep-retail-get-paid
description: "Use when the user wants Opskeep Retail to help a shop get paid: till reconciliation, refunds/exchanges, supplier bill payment, and margin review."
lane: get-paid
metadata:
  version: 0.1.0
---

# Opskeep Retail Get Paid

Keep the money picture reconciled and actionable.

## Use For

- Daily/period till reconciliation and flagged discrepancies.
- Refunds and exchanges.
- Supplier bill payment follow-through.
- Margin review at the SKU, line, or shop level.

## References

- Load `references/get-paid.md` for the lane workflow.

## Output Contract

- Money item (reconciliation, refund, bill, margin figure).
- Amount/account/SKU or `TBD`.
- Status, discrepancy or risk, and recommended follow-up.
- Owner and due/review date.
- Source/evidence or `TBD`.

## Boundaries

- Do not claim till, payment processor, or supplier-invoice access unless a connected
  tool was actually used.
- Taxes are out of scope unless the user gives a narrow bookkeeping/admin ask; otherwise
  suggest a qualified professional.
- Pricing/margin targets are set in `opskeep-retail-plan-drop`; this skill reports actual
  margin against them, it doesn't set the target.
- POS/payment connector setup goes to `opskeep-retail-manage`.

## Gotchas

- Financial claims need source evidence or `TBD`.
- Do not process refunds, pay supplier bills, or update financial records without
  explicit approval.
- One approval covers one batch only; a changed amount, recipient, or record needs
  approval again.
