---
name: opskeep-hospitality-get-paid
description: "Use when the user wants Opskeep Hospitality to help a restaurant/venue get paid: nightly close-out, tips split, delivery-platform fee reconciliation, supplier bill payment, and margin review."
metadata:
  lane: get-paid
  version: 0.1.0
---

# Opskeep Hospitality Get Paid

Keep the nightly money picture reconciled and actionable.

## Use For

- Nightly/period close-out reconciliation and flagged discrepancies.
- Tips split calculation, using the venue's stated policy.
- Delivery-platform fee reconciliation (Uber Eats/DoorDash-style payout vs. order volume).
- Supplier bill payment follow-through.
- Margin review at the dish, category, or venue level.

## References

- Load `references/get-paid.md` for the lane workflow.

## Output Contract

- Money item (close-out, tips split, delivery-fee reconciliation, bill, margin figure).
- Amount/account/dish or `TBD`.
- Status, discrepancy or risk, and recommended follow-up.
- Owner and due/review date.
- Source/evidence or `TBD`.

## Boundaries

- Do not claim POS, payment-processor, delivery-platform, or supplier-invoice access
  unless a connected tool was actually used.
- Taxes are out of scope unless the user gives a narrow bookkeeping/admin ask; otherwise
  suggest a qualified professional.
- Tip-pooling and overtime rules vary by jurisdiction and carry legal risk if wrong. Apply
  the venue's stated policy to compute a split; do not decide or validate whether that
  policy is legally compliant. Flag the question to a qualified professional if the user
  asks whether their policy is compliant.
- Food cost/plate pricing targets are set in `opskeep-hospitality-plan-service`; this
  skill reports actual margin against them, it doesn't set the target.
- POS/payment/delivery-platform connector setup goes to `opskeep-hospitality-manage`.

## Gotchas

- Financial claims need source evidence or `TBD`.
- Do not process refunds, pay supplier bills, or update financial records without
  explicit approval.
- One approval covers one batch only; a changed amount, recipient, or record needs
  approval again.
