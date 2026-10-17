---
name: opskeep-expense-tracking
description: Log, list, and summarize job- or client-tagged expenses (materials, mileage, travel, fees, software, other costs) through Opskeep's generic agent utility tools, including billable vs absorbed costs, receipt references, date ranges, per-currency totals, and marking expenses as invoiced. Use when the user wants to log a receipt, materials cost, filing fee or mileage against a job, list what's been logged, total a job's unbilled expenses before invoicing, or record which invoice they went on. Do not use for billable time (that's opskeep-time-tracking) or for creating/sending invoices (that's opskeep-get-paid).
metadata:
  lane: meta
  version: 0.2.0
---

# Opskeep Expense Tracking

Capture job-tagged expenses so they're ready to fold into that job's invoice.

This skill exists mainly for solo tradespeople and freelancers, where materials and
mileage are a direct, first-class part of a job's margin, not an edge case. See
[`docs/sole-trader-profile.md`](../../docs/sole-trader-profile.md) for the broader
context this was built to close.

CRITICAL: Never compute an amount from a mileage rate. If the user gives miles but
no amount, ask for the amount (or their rate) instead of inventing one — a wrong
invented mileage rate is a fabricated number on someone's invoice or tax filing.

## Workflow

1. **Pick mode.** Choose exactly one.

   - Log a cost: "log $40 for pipe fittings on the Miller job," "I drove 30 miles to the
     Chen site, that's $19.50" -> **log**.
   - List what's logged: "what have I logged for the Miller job?" -> **list**.
   - Total for invoicing: "what are my expenses on the Miller job?", "total up materials
     for this job" -> **summarize**.
   - Record invoicing: "those three went on INV-0142" -> **mark billed**.
   - Remove an entry: "remove that $40 pipe fitting entry" -> **delete**.
   - Payroll, receipt OCR/photo parsing, tax-rate computation, or multi-currency
     conversion -> explain this is out of scope, stop.

2. **Required fields for log mode.**

   - `jobLabel`: the job or client this expense belongs to. Ask if not stated or
     ambiguous against recent context.
   - `category`: `materials`, `mileage`, `travel`, `fees` (filing, bank, registration
     fees), `software`, or `other`.
   - `amount`: a figure in the stated currency.
   - `currency`: the stated currency, else the business's own currency from context.
     The server falls back to `OPSKEEP_DEFAULT_CURRENCY` (USD if unset); if neither the
     user nor context gives one, ask once rather than letting a wrong default through. If the user gives
     miles but no amount and no rate, ask for one directly: `What amount should I log for
     that mileage?` Do not assume a per-mile rate.
   - `miles`: optional, informational only, for `category=mileage`.
   - `billable`: default true. Set false when the user says the cost is theirs to absorb
     ("not rechargeable", "our cost").
   - `reference`: optional receipt, supplier-invoice or payment reference.
   - `description`, `date`: optional; default date to now.

   Call `log_expense` once fields are resolved. Do not ask for optional fields the user
   didn't mention.

3. **List mode.**

   Call `list_expenses`, filtered by `jobLabel`, `category`, `fromDate`/`toDate`, and
   `billing` (`billable`, `not_billable`, `unbilled`, `billed`) when given. Default to
   `status: "active"` unless the user asks for removed/all entries. Present entries in a
   scannable list: id, amount, currency, category, date, description, reference, billing
   state.

4. **Summarize mode.**

   Call `summarize_expenses` for the named job (with `fromDate`/`toDate` for a period).
   Report totals per currency, the per-category breakdown, and the split into billable
   not yet invoiced, already invoiced, and not billable. The "billable, not yet invoiced"
   figure is what hands to `opskeep-get-paid` for the next invoice. Never add totals in
   different currencies together.

5. **Mark billed mode.**

   After an invoice is approved and created, call `mark_expenses_billed` with the expense
   ids and the invoice reference, so they stop showing as unbilled. Confirm the ids and
   invoice reference with the user first; it's a record update.

6. **Delete mode.**

   Require an expense id from the request, conversation, or a prior list/log response. If
   missing or ambiguous, list active entries for the likely job first and ask which one.
   Call `delete_expense` only once the target is unambiguous.

## Output Contract

- Mode used.
- Job label.
- Amount(s), currency and category; billable state.
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
- Entries are stored by the local `opskeep-tools` MCP server in a file on the user's own
  machine (`~/.opskeep/registry.json` by default, see [mcp-server](../../mcp-server)), so
  they persist across sessions on that machine but don't sync to other devices. Say so
  plainly if the user asks.
