---
name: opskeep-accounting-engage
description: "Use when an accounting or bookkeeping practice is taking on a client or changing what it does for one: scope of services for the engagement letter, client onboarding and KYC/AML document checklist, responsibilities split, and the fee basis handed to get-paid."
metadata:
  lane: engage
  version: 0.1.0
---

# Opskeep Accounting Engage

Turn "we'd like you to do our books" into a defined engagement the practice can deliver
and bill.

## Use For

- Scope of services for an engagement letter (what's in, what's out, frequency, period).
- Client onboarding checklist: identity/KYC documents, registrations, system access.
- Responsibilities split between practice and client (who supplies what, by when).
- Fee basis (fixed monthly, fixed per job, hourly, retainer) handed to `opskeep-get-paid`.
- Re-scoping an existing client when services are added or dropped.
- Finance health check for a new client: a scored baseline of how their finance function
  runs today, with findings that shape the scope.

## References

- Load `references/engage.md` for the workflow and output shape.
- Load `references/finance-health-check.md` for the health-check areas, scoring and output.

## Output Contract

- Client entity and entity type, or `TBD`.
- Services in scope with frequency and period; explicit out-of-scope list.
- Client responsibilities and the date each is due.
- Onboarding checklist with received/missing status.
- Fee basis and amount, or `TBD`, marked for the accountant's confirmation.
- Items `Needs your review` (independence, conflicts, risk rating).

## Boundaries

- The engagement letter's legal terms (liability caps, governing law, professional body
  wording) come from the practice's own template. Do not draft legal clauses from
  scratch; fill the practice's template or list the clauses as `TBD`.
- KYC/AML: list what the practice's policy requires and track receipt. Do not decide a
  client's risk rating or clear them; that's the accountant's call.
- Pricing is the accountant's. Never propose a fee amount the user didn't give.
- Adding the client to the roster after engagement -> `opskeep-accounting-manage`.

## Gotchas

- Do not send the letter or any onboarding request without explicit approval.
- Identity documents are sensitive: refer to them by type and status, never copy their
  numbers into outputs.
