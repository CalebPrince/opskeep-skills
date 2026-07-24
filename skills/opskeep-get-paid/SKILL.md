---
name: opskeep-get-paid
description: Tracks money follow-through — invoices, payments, billable time, budgets, margin, and the money impact of change control — for work that's been scoped or delivered.
lane: get-paid
---

# Get paid

Covers everything money-related once there's a scope or delivered work to bill against.

## When to trigger

- "Invoice [client] for [project]."
- "What's outstanding right now?"
- "Add these two extra revision rounds to the bill."
- Logging billable time, checking budget/margin on a project.

## What to gather

- The relevant scope or rate (from `opskeep-scope-work` records, or ask if none exist —
  never invent a number).
- Payment terms already agreed (net-15/30, deposit structure, milestone billing).
- Existing invoice/payment history for the client, to avoid double-billing or gaps.

## What to produce

- An invoice line item or full invoice draft: description, amount, due date — tied
  explicitly to the scope or time it's billing for.
- An outstanding-balance summary when asked: who owes what, since when, and whether a
  reminder is due.
- A budget/margin check: hours or spend so far against what was scoped, flagged early if
  trending over.

## Handoffs

- A scope change needs billing → confirm with `opskeep-scope-work`'s record before adding
  a line item.
- A payment reminder needs to go out on a schedule → `opskeep-tools` for the hosted
  reminder utility.

## Guardrails

- Never fabricate a dollar amount, rate, or due date. If the source scope record doesn't
  have one, ask instead of estimating.
