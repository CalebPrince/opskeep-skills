# Opskeep Accounting Engage Reference

Produce an engagement the accountant can sign: scope, responsibilities, onboarding
status, fee basis. Not a sales pitch.

## Starter Jobs

- "New client wants monthly bookkeeping and payroll. Draft the scope."
- "What do we still need from Asante Ventures before we can start?"
- "Client wants us to add VAT returns. Update the scope and flag the fee change."

## Required Inputs

- Client name and entity type (sole trader, partnership, limited company, NGO, other).
- Services requested and the period they start from.
- The practice's engagement-letter template and KYC policy, if it has them, or `TBD`.
- Fee basis and amount if the accountant has set one, or `TBD`.

## Workflow

1. Restate the request as a services list. For each service: frequency (monthly,
   quarterly, annual, one-off), first period covered, deliverable (for example "monthly
   management accounts by working day 10").
2. Write an explicit out-of-scope list for the obvious neighbours (for example payroll
   when only bookkeeping was asked, tax advice when only compliance was asked, catch-up
   of prior periods).
3. List client responsibilities: records to supply, by when each period, system access to
   grant, who approves.
4. Build the onboarding checklist from the practice's KYC policy. Without a policy, list
   the categories the accountant must confirm (identity of owners/directors, proof of
   address, registration documents, tax identification) as `Needs your review`, not as
   a definitive legal list.
5. Fee basis: record what the accountant set. If the scope change adds work and the fee
   is unchanged, flag `Fee impact: Needs your review` and hand to `opskeep-get-paid`
   change-control.
6. Hold everything client-facing as a draft until approved.

## Output Shape

```md
Engagement: [client] ([entity type])

In scope
- [service] - [frequency], from [period], deliverable: [what, by when]

Out of scope
- [item]

Client provides
- [record/access] - by [date or "working day N each month"]

Onboarding checklist
- [document type] - received / missing / TBD

Fee basis: [basis, amount or TBD] (confirm)
Needs your review: [risk rating, independence/conflicts, fee impact]
Next action: [owner] - [action] - [date]
```

## Rules

- Never invent a service the client didn't ask for; suggest it separately if useful.
- Never fill a fee, liability clause or regulatory statement from memory.
