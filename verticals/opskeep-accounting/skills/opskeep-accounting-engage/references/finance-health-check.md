# Finance Health Check

A scored baseline of how a client's finance function runs today. Use at onboarding or
an annual review, so the engagement scope fixes what's actually weak.

## Areas

| Area | What to look at |
|---|---|
| People & capability | Who does the bookkeeping, their skills, cover when they're away |
| Process discipline | Regular reconciliations, month-end routine, records kept on time |
| Systems & data | Accounting software in use, bank feeds, spreadsheets outside the system, data quality |
| Financial controls | Approval limits, separation of duties (preparer vs approver), access to bank accounts |
| Reporting quality | Whether management accounts exist, how soon after month-end, whether they're used |
| Compliance | Registrations in place, filings on time, evidence kept (see the deadlines lane) |

## Scoring

- Score each area 0-100 from evidence the user gives (answers, documents, a look at the
  books). Use bands: 0-39 weak, 40-69 developing, 70-100 established.
- Every score names its evidence. An area with no evidence is `TBD`, not a guess.
- The overall score is the simple average of scored areas; say how many were `TBD`.

## Findings

Each finding: area, what was seen, why it matters, recommended action, owner, and whether
it becomes an in-scope service. Mark progress as `open` / `done`.

## Output Shape

```md
Finance health check: [client] - [date]

| Area | Score | Band | Evidence |
|------|-------|------|----------|

Overall: [score] ([n] of 6 areas scored)

Findings
- [area]: [finding] -> [action] ([owner], [in scope? yes/no]) [open/done]

Needs your review: [scores or findings the accountant should confirm]
```

## Rules

- The scores are the accountant's to confirm before the client sees them.
- Don't share a client's score next to another client's.
