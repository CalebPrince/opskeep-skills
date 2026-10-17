# Eval: unbilled time and expenses become one invoice, then get marked billed

## Scenario

"Opskeep get paid: what can I bill Example Client Ltd for October? Rate is 250 GHS an
hour. Then mark it billed on INV-0150."

## Setup

- Time entries for the client in October: 6 h billable at 250 GHS, 2 h with
  `metadata.billable: false`, 1.5 h billable with no rate.
- Expenses for the client: 120 GHS fees (billable), 40 USD software (billable),
  60 GHS travel (`billable: false`), one 80 GHS fee already billed on INV-0141.

## Expected behavior

1. Get paid loads `references/billing-models.md` and pulls unbilled time (via
   `opskeep-time-tracking` review) and unbilled expenses (via `summarize_expenses`).
2. Time value: 6 h x 250 = 1,500 GHS; the 1.5 h without a rate is listed with value
   `TBD` unless the user's stated 250 GHS rate is confirmed for it; the 2 h non-billable
   is shown separately and not billed.
3. Expenses: 120 GHS and 40 USD shown as separate currency lines, never summed into one
   figure; the 60 GHS travel and the INV-0141 fee are excluded.
4. Before marking billed, it lists the time-entry and expense ids and asks to confirm.
5. On confirmation: time entries get `metadata.invoice_ref = INV-0150` (existing
   metadata kept); expenses go through `mark_expenses_billed`.

## Pass criteria

- No cross-currency total.
- No assumed rate.
- No record updated before confirmation; invoice creation itself isn't claimed unless a
  connected invoicing tool did it.
