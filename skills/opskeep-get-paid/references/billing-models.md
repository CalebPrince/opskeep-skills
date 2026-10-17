# Opskeep Get Paid — Billing Models, WIP and Retainers

Use when deciding what to bill this period, or checking whether a fixed fee, retainer or
hourly engagement is earning what it should. Common for accountants, consultants and
agencies.

## Billing Models

- **Hourly / time-and-materials**: bill = billable hours x rate + billable expenses.
- **Fixed fee per job** (for example annual accounts): bill on the agreed milestones;
  track time against it to see recovery.
- **Fixed monthly** (for example monthly bookkeeping): bill the same amount each period;
  track time to see whether the fee still covers the work.
- **Retainer**: client pre-pays a sum or a block of hours; work draws it down; bill or
  top up when it runs low.

## Work in Progress (WIP) — unbilled work

1. Pull billable time not yet invoiced from `opskeep-time-tracking` (review mode, filter
   unbilled) and billable expenses from `opskeep-expense-tracking` (summarize, billable
   only).
2. WIP value = unbilled hours x rate (per currency) + unbilled billable expenses.
3. Age WIP by the date of the oldest unbilled entry. Old WIP is a billing risk.

Rates come from the time entry's `rate_amount` or the user. Missing rate -> `TBD`, never
an assumed rate.

## Recovery (is the fee covering the work?)

- Recovery % = amount billed (or fixed fee) / (hours x standard rate).
- Under 100%: the job is taking more time than the fee pays for. Above 100%: billed above
  standard rate.
- Show the inputs. A fixed-fee job with no time logged has recovery `TBD`.

## Write-ups and Write-downs

- **Write-down**: billing less than WIP value (scope overrun, goodwill). **Write-up**:
  billing more (agreed fixed fee above time cost).
- Propose with the reason and amount, marked `Needs your decision`. Never apply one
  silently to an invoice draft.

## Retainer Drawdown

- Balance = retainer received - work drawn down to date (value or hours).
- Flag when the balance drops below the user's threshold (ask; suggest 20%) with a top-up
  request draft, sent only after approval.

## Output Shape

```md
Billing check: [client/job] - [period]
Model: [hourly/fixed/monthly/retainer]
Unbilled time: [hours] at [rate] = [value] [currency] (source: time tracking)
Unbilled expenses: [value] [currency] (source: expense tracking)
WIP total: [value] [currency], oldest entry [date]
Recovery: [%] ([inputs]) or TBD
Proposed: bill [amount] / write-down [amount, reason] (Needs your decision)
Next action: [owner] - [action] - [date]
```

## Rules

- Never add amounts in different currencies.
- After an invoice is approved and created, mark the included time and expense entries as
  billed (time: `metadata.invoice_ref`; expenses: `billed` via `opskeep-expense-tracking`)
  so they don't show up as WIP again. Ask first; it's a record update.
