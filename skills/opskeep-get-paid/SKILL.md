---
name: opskeep-get-paid
description: "Use when the user wants Opskeep to help a service business get paid: invoices, payments, aged receivables (who owes us), collection follow-up, billable time and unbilled work (WIP), fixed-fee, hourly and retainer billing, recovery and write-downs, budgets, margin, change-control money impact, and payment follow-through."
metadata:
  lane: get-paid
  version: 0.2.0
---

# Opskeep Get Paid

Keep money follow-through visible and actionable.

## Use For

- Invoices, payments, billable time, budget health, margin, and money-risk review.
- Change-control impact when scope changes affect money.
- Aged receivables (who owes us, by age bucket) and the collection follow-up ladder.
- Unbilled work (WIP), fixed-fee recovery, retainer drawdown, write-up/write-down proposals.
- Payment follow-up planning.

## References

- Load `references/getting-paid.md` first.
- Use `references/initiate-budget.md`, `references/monitor-budget.md`, and `references/execute-change-control.md` for budget, burn, margin, and money-impacting changes.
- Use `references/receivables.md` for aged debtors, overdue lists, collection follow-up and write-off proposals.
- Use `references/billing-models.md` for hourly, fixed-fee, fixed-monthly and retainer billing, WIP, recovery and write-ups/downs.
- Load `references/examples/getting-paid.md` when an example shape helps.
- Load `references/sole-trader.md` when the requester is a solo tradesperson/freelancer invoicing directly, not a team engagement.

## Output Contract

- Money item.
- Amount/account/project or `TBD`.
- Status, risk, and recommended follow-up.
- Owner and due/review date.
- Source/evidence or `TBD`.

## Boundaries

- Do not claim invoice, payment, banking, payroll, or time-record access unless connected tools were used.
- Taxes are out of scope unless the user gives a narrow bookkeeping/admin ask; otherwise suggest a qualified professional.
- Time record create/update actions go through `opskeep-tools` to `opskeep-time-tracking`.
- Mileage/job-material expense capture and lookup go through `opskeep-tools` to `opskeep-expense-tracking`.

## Gotchas

- Financial claims need source evidence or `TBD`.
- Never add amounts in different currencies together; total each currency separately.
- Write-offs, write-downs and pausing work for non-payment are the owner's decision: propose with reasons, don't apply.
- Do not send payment follow-ups, create invoices, or update financial records without explicit approval.
- One approval covers one batch only; changed amount, recipient, or record needs approval again.
