# Opskeep Accounting Practice Profile Reference

## Practice Profile Fields

- Practice name, country, base currency, timezone.
- Services offered (bookkeeping, payroll, VAT/sales-tax returns, annual accounts,
  tax compliance, management reporting, advisory).
- People: who prepares, who reviews, who signs off. Maker-checker rule: the preparer of a
  piece of work can't approve it. Record approval limits if the practice has them (for
  example journals above an amount need the partner). A sole practitioner records
  themself as both, and outputs note there was no independent review.
- Templates on file: engagement letter, KYC policy, close checklist, request list.

## Client Roster Fields (one record per entity)

| Field | Example | Used by |
|---|---|---|
| Entity name | Owusu Logistics Ltd | all |
| Entity type | Limited company | engage, deadlines |
| Country | Ghana | deadlines |
| Currency | GHS | close, report |
| Year-end | 31 December | deadlines, close |
| Registrations | Income tax, VAT, payroll/withholding, social security (each yes/no/TBD) | deadlines |
| Services in scope | Monthly bookkeeping, VAT returns | collect, close |
| Accounting software | Xero / QuickBooks / Sage / Zoho Books / Tally / spreadsheet | close, report |
| Fee basis | Fixed monthly / hourly / retainer (amount held in get-paid) | get-paid |
| Preparer / reviewer | names | all |
| Contact for records | name + channel | collect |
| Sensitive IDs on file | yes/no (numbers not stored here) | engage |

The example values show shape only; never prefill a real client's fields.

## Preferences (ask once, store, reuse)

- Records due date each period (for example working day 5).
- Chase ladder spacing (for example 3 and 7 working days after the due date).
- Deadline warning window (suggest 14 days).
- Report materiality threshold (percentage and amount).
- Stale reconciling-item threshold (for example 60 days).

## Connector Checks

1. Ask which software each client uses; don't assume.
2. Use `composio-mcp` discovery to find whether a matching toolkit is connected. Never
   guess a slug.
3. Report per client: connected / not connected, read and/or write, and the last
   successful read if known.
4. Not connected: the lanes still work from exports or figures the user pastes; say so.
