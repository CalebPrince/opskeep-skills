---
name: opskeep-expense-tracking
description: Log, list, and summarize job-tagged expenses (materials, mileage, other costs) through Opskeep's generic agent utility tools. Use when the user wants to log a receipt, materials cost, or mileage against a job, list what's been logged, or total a job's expenses before invoicing. Do not use for billable time (that's opskeep-time-tracking) or for creating/sending invoices (that's opskeep-get-paid).
lane: meta
metadata:
  version: 0.1.0
---

# Opskeep Expense Tracking

Capture job-tagged expenses so they're ready to fold into that job's invoice.

This skill exists mainly for solo tradespeople and freelancers, where materials and
mileage are a direct, first-class part of a job's margin, not an edge case. See
[`docs/sole-trader-profile.md`](../../docs/sole-trader-profile.md) for the broader
context this was built to close.

CRITICAL: Never compute a dollar amount from a mileage rate. If the user gives miles but
no dollar amount, ask for the amount (or their rate) instead of inventing one — a wrong
invented mileage rate is a fabricated number on someone's invoice or tax filing.

## Workflow

1. **Pick mode.** Choose exactly one.

   - Log a cost: "log $40 for pipe fittings on the Miller job," "I drove 30 miles to the
     Chen site, that's $19.50" -> **log**.
   - List what's logged: "what have I logged for the Miller job?" -> **list**.
   - Total for invoicing: "what are my expenses on the Miller job?", "total up materials
     for this job" -> **summarize**.
   - Remove an entry: "remove that $40 pipe fitting entry" -> **delete**.
   - Payroll, receipt OCR/photo parsing, tax-rate computation, or multi-currency
     conversion -> explain this is out of scope, stop.

2. **Required fields for log mode.**

   - `jobLabel`: the job or client this expense belongs to. Ask if not stated or
     ambiguous against recent context.
   - `category`: `materials`, `mileage`, or `other`.
   - `amount`: a dollar figure, in the stated or default currency. If the user gives
     miles but no amount and no rate, ask for one directly: `What amount should I log for
     that mileage?` Do not assume a per-mile rate.
   - `miles`: optional, informational only, for `category=mileage`.
   - `description`, `date`: optional; default date to now.

   Call `log_expense` once fields are resolved. Do not ask for optional fields the user
   didn't mention.

3. **List mode.**

   Call `list_expenses`, filtered by `jobLabel` and/or `category` when given. Default to
   `status: "active"` unless the user asks for removed/all entries. Present entries in a
   scannable list: id, amount, category, date, description.

4. **Summarize mode.**

   Call `summarize_expenses` for the named job. Report the total and the per-category
   breakdown, framed as ready to hand to `opskeep-get-paid` for invoicing.

5. **Delete mode.**

   Require an expense id from the request, conversation, or a prior list/log response. If
   missing or ambiguous, list active entries for the likely job first and ask which one.
   Call `delete_expense` only once the target is unambiguous.

## Output Contract

- Mode used.
- Job label.
- Amount(s) and category.
- Expense id after log; full breakdown after summarize.
- One direct clarifying question at a time for missing/ambiguous required fields.

## Boundaries

- Billable time goes through `opskeep-tools` to `opskeep-time-tracking`.
- Creating or sending an invoice goes through `opskeep-get-paid`; this skill only supplies
  the expense total for it to use.
- Do not invent a mileage rate, a currency conversion, or a category the user didn't
  state.

## Gotchas

- "Log paid $200 to the client" is not an expense; that's a payment received, not a cost.
  Route that to `opskeep-get-paid` instead.
- If the same job name could refer to multiple past jobs for the same client, ask which
  one rather than guessing.
- This is an open-source scaffold: entries are stored in memory by the local MCP server
  and reset on restart (see [mcp-server](../../mcp-server)). Say so plainly if the user
  asks whether logged expenses persist across sessions.
