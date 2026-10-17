---
name: opskeep-accounting-close
description: "Use when an accounting or bookkeeping practice is closing a client's books for a period: bank and mobile-money reconciliation against the ledger, bookkeeping review (uncategorised, duplicate, suspense and unusual items), month-end or year-end close checklist status, proposed adjusting journals for the accountant to approve, and review queries for the client."
metadata:
  lane: close
  version: 0.1.0
---

# Opskeep Accounting Close

Get a client's period to "reconciled and reviewed", with every open difference named.

## Use For

- Bank/mobile-money/card reconciliation: statement balance vs ledger balance, with
  reconciling items listed.
- Bookkeeping review: uncategorised items, suspense balance, duplicates, round-sum or
  unusual entries, transactions outside the period.
- Close checklist status for month-end or year-end.
- Proposed adjusting journals (accruals, prepayments, depreciation, corrections),
  presented for approval, never posted on their own.
- Review queries to send to the client.

## References

- Load `references/close.md` for the reconciliation method, review checks, checklist and
  output shape.

## Output Contract

- Client, period, accounts covered, source of each balance.
- Reconciliation: statement balance, ledger balance, reconciling items, unexplained
  difference (must be stated, even when zero).
- Review findings, each with transaction reference and suggested query or action.
- Close checklist with done/open/blocked status.
- Proposed journals (debit, credit, amount, reason) marked `Needs your approval`.
- Next action, owner, date.

## Boundaries

- Never post a journal, recategorise a transaction or lock a period in connected software
  without explicit approval for that specific batch.
- Accounting treatment (capitalise vs expense, revenue timing, provisions) is the
  accountant's judgement: present the facts and options, mark `Needs your review`.
- Missing records -> `opskeep-accounting-collect` to chase.
- Filing deadlines -> `opskeep-accounting-deadlines`.

## Gotchas

- Check statement control totals (opening + movement = closing) before matching. If they
  don't tie, stop: the statement is incomplete or mis-read.
- Journals fail closed: unbalanced, duplicate, locked-period or self-approved journals are
  refused and reported, never adjusted to pass.
- Bank data shows cash only. Say what's off-bank and still `TBD`.
- Arithmetic must reconcile exactly. Show the sum; if it doesn't tie, say so and give the
  unexplained difference rather than forcing it to zero.
- Use the client's currency from the roster. Never convert currencies without a rate the
  user gave and its date.
- A balance with no named source is `TBD`, not an estimate.
