# Opskeep Get Paid — Receivables (who owes us)

Use for aged debtors, overdue invoice lists, collection follow-up planning, and bad-debt
or write-off questions on the business's own invoices.

## Required Inputs

- Open invoices: client, invoice number, issue date, due date, amount, amount paid,
  currency. Source: connected invoicing/accounting tool, an export, or the user.
- As-of date (default today, in the business timezone).
- Payment terms if due dates are missing (ask; don't assume 30 days).

## Aging Method

1. Outstanding = amount - amount paid. Skip fully paid invoices; list part-paid ones with
   the remaining balance.
2. Days overdue = as-of date - due date. Not yet due = negative.
3. Buckets: `Not yet due`, `1-30`, `31-60`, `61-90`, `90+` days overdue.
4. Total per bucket **per currency**. Never add different currencies together; show a
   separate total for each.
5. Per client: total outstanding, oldest invoice, and whether it's one late invoice or a
   pattern.

## Collection Ladder (drafts only, send after approval)

1. **Due-date nudge** (just due): friendly, invoice number, amount, how to pay.
2. **Overdue reminder** (1-30): restate, ask if anything's blocking payment.
3. **Firm follow-up** (31-60): name the total overdue, propose a pay-by date.
4. **Escalation** (61+): a call or meeting, a payment plan, or pausing work. Pausing work
   or any legal step is the owner's decision: route through
   `skills/opskeep-deliver-work/references/monitor-risk-escalation.md` and mark it
   `Needs your decision`.

Relationship-sensitive clients: route tone to `opskeep-keep-clients`.

## Write-offs and Bad Debt

- Propose, never decide. List the invoice, age, collection history and reason it may be
  uncollectable, marked `Needs your decision`.
- How a write-off is treated in the books or for tax is out of scope; note that the
  accountant should confirm.

## Output Shape

```md
Receivables as of [date]

| Bucket | [Currency] total | Invoices |
|--------|------------------|----------|

By client
- [client]: [outstanding] [currency], oldest [invoice] [n] days overdue, step [ladder]

Recommended next: [owner] - [action] - [date]
Source: [tool/export/user]
```

## Rules

- No invented payment status. "Paid" comes from a connected source or the user.
- Don't count credit notes or deposits silently; list them as their own lines.
