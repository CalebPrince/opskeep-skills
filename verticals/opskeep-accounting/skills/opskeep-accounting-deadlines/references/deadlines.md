# Opskeep Accounting Deadlines Reference

Produce a dated, sourced, owned list. A deadline without a source or an owner is a risk,
so say so.

## Starter Jobs

- "What's due across all my clients in the next 30 days?"
- "Build Asante Ventures' compliance calendar for 2027."
- "Anything overdue?"

## Where Dates Come From (in this order)

1. The practice's own deadline rules for that client, recorded in
   `opskeep-accounting-manage` or a calendar/spreadsheet the user shares.
2. A date the user states in the conversation.
3. An official source (tax authority, registrar, social-security body) looked up now
   with a connected web/search tool, cited with the page and the date it was checked.

If none of these is available, the due date is `TBD` and the item is listed as
`Needs a date`. Never fill a date from general knowledge: rules differ by country, entity
type, registration and year, and change.

## Required Inputs

- Client roster with entity type, country, registrations (income tax, VAT/sales tax,
  payroll/withholding, social security), year-end, or `TBD` per field.
- Prep status per obligation, or `TBD`.
- Today's date and the practice timezone.

## Urgency Rules

- **Overdue**: due date passed, not marked filed.
- **Due soon**: within the practice's warning window (ask if unset; suggest 14 days).
- **Blocked**: prep can't finish because records are missing (link to collect).
- **On track**: prep started, owner named, no blocker.

## Output Shape

```md
Deadlines as of [date] ([timezone])

| Due | Client | Obligation | Period | Status | Owner | Blocker | Source |
|-----|--------|------------|--------|--------|-------|---------|--------|

Overdue: [n]  Due soon: [n]  Blocked: [n]  Needs a date: [n]
Next action: [owner] - [action] - [date]
```

## Rules

- Mark an item filed only on the user's word or a connected source showing it.
- One row per obligation per period; don't merge a client's VAT and payroll into one row.
- A practice-wide view lists client names and obligations only, never one client's
  figures next to another's.
