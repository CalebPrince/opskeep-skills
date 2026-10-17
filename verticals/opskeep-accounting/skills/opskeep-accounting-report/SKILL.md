---
name: opskeep-accounting-report
description: "Use when an accounting or bookkeeping practice needs to turn a client's closed figures into something the client can act on: management-accounts commentary, profit and loss and balance sheet variances against prior period or budget, cash position and short-term cash outlook, key ratios and KPIs, and plain-language questions or recommendations for the client."
metadata:
  lane: report
  version: 0.1.0
---

# Opskeep Accounting Report

Explain what the numbers mean, in words the client's owner understands, with every
figure traceable.

## Use For

- Monthly/quarterly management-accounts commentary.
- Variance table: actual vs prior period, same period last year, or budget.
- Cash position and a short-term cash outlook from known receipts and payments.
- Ratios and KPIs: gross margin, net margin, debtor days, creditor days, current ratio,
  cash runway.
- Questions for the client and suggested next steps.

## References

- Load `references/report.md` for the variance method, KPI formulas, writing rules and
  output shape.

## Output Contract

- Client, period, comparison basis, source of the figures, and whether the period is
  closed (from `opskeep-accounting-close`) or provisional.
- Headline (three bullets at most).
- Variance table with amount and % change, and a reason for each material line or
  `Reason TBD: ask client`.
- KPIs with the formula inputs shown.
- Cash position and outlook, with assumptions listed.
- Questions for the client; recommendations marked as suggestions for the accountant to
  approve.

## Boundaries

- Report only figures that came from the ledger, a report export, or the user. Never
  infer a missing line.
- Forecasts are labelled as outlooks with their assumptions, never as guarantees.
- Investment, borrowing or tax advice to the client is the accountant's call; frame as
  `For discussion` and mark `Needs your review`.
- Sharing the report with the client is an outbound send: draft only until approved.

## Gotchas

- If the period isn't closed, say `Provisional` at the top.
- Materiality threshold comes from the practice preference; if unset, ask once and
  default to flagging lines that moved more than 10% and a meaningful amount.
- Never put another client's figures in as a benchmark.
