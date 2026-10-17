---
name: opskeep-accounting-collect
description: "Use when an accounting or bookkeeping practice needs records from a client: build a document request list (PBC list) for a period, track what's received versus missing, and draft polite, escalating chase messages for bank statements, receipts, invoices, payroll data and other records."
metadata:
  lane: collect
  version: 0.1.0
---

# Opskeep Accounting Collect

Get the client's records in, on time, without the accountant writing the same chase email
every month.

## Use For

- Document request (PBC) list for a client and period, tied to the services in scope.
- Received/missing tracker, per item.
- Chase drafts on a ladder: friendly reminder, firm reminder, deadline-risk notice.
- Telling the accountant which missing items block which deadline.

## References

- Load `references/collect.md` for the request-list template, chase ladder and output.

## Output Contract

- Client and period.
- Each requested item: description, why it's needed, due date, status.
- Items blocking a deadline, with the deadline from `opskeep-accounting-deadlines` or `TBD`.
- Chase draft (if asked), with the ladder step named.
- Next action, owner, date.

## Boundaries

- Sending a chase is an outbound message: draft only, send after explicit approval.
- A one-off "remind me to chase on Friday" -> `opskeep-tools` to
  `opskeep-follow-up-reminders`. A monthly recurring chase -> core `opskeep-manage`.
- Treatment of a missing item in the ledger (suspense, estimate) -> `opskeep-accounting-close`.

## Gotchas

- Don't mark anything received unless the user said so or a connected source shows it.
- Ask for each item once. Don't request records the client already sent.
- Keep chase tone matched to the relationship; route a strained relationship to core
  `opskeep-keep-clients` for tone.
