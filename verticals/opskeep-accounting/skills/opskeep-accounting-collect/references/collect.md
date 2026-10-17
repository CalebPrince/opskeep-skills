# Opskeep Accounting Collect Reference

Produce a request list the client can work through and a tracker the accountant can trust.

## Starter Jobs

- "Build the September request list for Owusu Logistics."
- "What's still missing for the year-end and what does it block?"
- "Draft a second chase for the bank statements."

## Required Inputs

- Client, period, and services in scope (from `opskeep-accounting-engage` or the user).
- What has already been received, or `TBD`.
- The practice's internal due date for records (for example "working day 5"), or `TBD`.

## Request List Building Blocks

Pick only what the services in scope need. Typical items:

- **Bookkeeping**: bank and mobile-money statements for every account (full period,
  opening to closing balance), sales invoices issued, purchase invoices and receipts,
  petty cash record, loan statements.
- **Payroll**: starters/leavers, pay changes, hours or overtime, deductions.
- **Sales tax/VAT returns**: sales and purchase listings for the return period, import
  documents if relevant.
- **Year-end**: fixed-asset additions/disposals with invoices, stock count, debtor and
  creditor listings at year-end, loan and lease agreements, director/owner transactions,
  confirmation of any post-year-end events.

Each item gets: what exactly (account name, period), why (one short reason the client
understands), due date.

## Chase Ladder

1. **Reminder** (due date passed): friendly, lists only outstanding items.
2. **Firm reminder** (a few working days later): restates items and the practice's
   internal deadline.
3. **Deadline-risk notice**: names the filing or report the gap puts at risk and its due
   date, and what happens next (late filing exposure, delayed report). Never threaten a
   penalty amount that isn't sourced.

Timing between steps follows the practice's preference set in
`opskeep-accounting-manage`, else ask.

## Output Shape

```md
Records request: [client] - [period]

| # | Item | Why we need it | Due | Status |
|---|------|----------------|-----|--------|

Blocking: [item] -> [deadline/report] due [date or TBD]
Chase: step [1/2/3] draft below (not sent)
Next action: [owner] - [action] - [date]
```

## Rules

- Statuses are `received`, `partial`, `missing`, or `TBD`.
- Partial bank statements (gaps in dates) are `partial`, with the missing date range named.
- Chase drafts never include another client's name or data.
