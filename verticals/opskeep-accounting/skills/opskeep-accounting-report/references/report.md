# Opskeep Accounting Report Reference

Produce a report an owner reads in two minutes and an accountant can tick line by line.

## Starter Jobs

- "Write the September management-accounts commentary for Owusu Logistics."
- "Why did gross margin drop this quarter?"
- "How many months of cash does Mensah & Sons have?"

## Required Inputs

- Period P&L and balance sheet (export, connected software, or pasted), with source.
- Comparison figures (prior period, last year, or budget), or `TBD`.
- Close status from `opskeep-accounting-close`.
- Known upcoming receipts and payments for a cash outlook, or `TBD`.

## Variance Method

1. Variance = actual - comparison; % = variance / |comparison|. Comparison of zero ->
   `n/a`, not infinity.
2. Material = beyond the practice threshold. Only material lines need a written reason.
3. Reasons come from the ledger detail or the client. If neither explains it, write
   `Reason TBD: ask client` and add it to the questions list.
4. Revenue up and cost up together: say whether margin held, not just that both rose.

## KPI Formulas (show inputs every time)

- Gross margin % = gross profit / revenue
- Net margin % = net profit / revenue
- Debtor days = trade debtors / revenue for the period x days in period
- Creditor days = trade creditors / cost of sales (or purchases) for the period x days
- Current ratio = current assets / current liabilities
- Cash runway (months) = cash available / average monthly net cash outflow (only when
  outflow is positive; otherwise say the business is cash-generative this period)

## Writing Rules

- Plain language. "Customers are taking 52 days to pay, up from 38" beats "debtor days
  deteriorated".
- Lead with what changed and what to do about it.
- Every number in prose matches the table.
- No jargon without a short explanation the first time.

## Output Shape

```md
[Client] - Management report, [period] ([Closed/Provisional])
Source: [ledger/export, date]

Headline
- [one line]

| Line | Actual | [Comparison] | Change | % | Reason |
|------|--------|--------------|--------|---|--------|

KPIs
- [KPI]: [value] ([inputs])

Cash: [balance at date]. Outlook [n] weeks: [figure] assuming [assumptions].

Questions for the client
- [question]

For discussion (Needs your review)
- [suggestion]
```
