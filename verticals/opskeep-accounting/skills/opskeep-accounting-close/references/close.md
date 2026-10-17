# Opskeep Accounting Close Reference

Produce a reconciliation that ties, a review list with references, and a checklist that
shows what's left.

## Starter Jobs

- "Reconcile Owusu Logistics' GCB current account for September."
- "Review the ledger before I do the month-end. Anything odd?"
- "Where are we on the year-end close for Mensah & Sons?"

## Required Inputs

- Client, period, and which accounts.
- Statement closing balance and ledger closing balance at the same date, with sources
  (statement PDF/export, ledger export, connected software via `composio-mcp`), or `TBD`.
- Transaction listings if items need matching.
- The practice's close checklist, if it has one.

## Statement Intake Checks (before matching)

Statements arrive as CSV, Excel, PDF or mobile-money exports. Before using one:

1. Map columns to date, description/narration, and either a signed amount or separate
   debit and credit columns. If the mapping is unclear, ask; don't guess the sign.
2. Control totals: row count, total in, total out, net movement. Opening balance + net
   movement must equal the closing balance on the statement. If it doesn't, the
   statement is incomplete or mis-read; stop and say so.
3. Check for date gaps against the period (missing pages or days) and flag as `partial`
   for `opskeep-accounting-collect` to chase.
4. Scanned/image PDFs: say text can't be read reliably without OCR and ask for a CSV or
   Excel export instead of transcribing figures by eye.
5. Keep the original file untouched; every figure used traces back to it.

## Classification Suggestions

- Suggest a category per line with a confidence (high / medium / low) and the reason
  (payee name, keyword, amount pattern).
- **Internal transfers** between the client's own accounts are not income or expense:
  pair both legs and flag them as transfers.
- **Possible duplicates** across overlapping statement imports are flagged, not removed.
- Low-confidence lines go to `Evidence needed` (route the request to
  `opskeep-accounting-collect`), not into a guessed category.
- Suggestions are suggestions. Applying them in the ledger is a write that needs approval.

## Completeness Note

Bank statements show cash movement only. Credit sales, unpaid supplier bills, cash
takings that never reached the bank, accruals and non-cash items are not on them. Every
close output from bank data alone says what's off-bank and still `TBD`.

## Reconciliation Method

1. Confirm both balances are at the same date and in the same currency.
2. Match statement lines to ledger lines by amount and date (allow a short date window
   for timing), then by reference.
3. Classify unmatched items:
   - **Timing**: unpresented payments, outstanding deposits (in ledger, not yet on
     statement). Expected to clear next period.
   - **Not yet recorded**: bank charges, interest, direct debits, mobile-money fees on
     the statement but missing from the ledger. Proposed journal.
   - **Errors**: transposed or duplicated amounts, wrong account. Proposed correction.
4. Compute: statement balance - unpresented payments + outstanding deposits = adjusted
   bank balance. Ledger balance + not-yet-recorded items +/- corrections = adjusted ledger
   balance. Unexplained difference = adjusted bank - adjusted ledger.
5. Show every figure in the computation so it can be ticked.
6. Timing items older than the practice's threshold (ask if unset) are flagged: a stale
   unpresented cheque or deposit is a review item, not a timing item.

## Review Checks

- Uncategorised / suspense balance and its age.
- Possible duplicates (same amount, payee, close dates).
- Round-sum or unusually large items relative to the client's normal pattern.
- Transactions dated outside the period.
- Owner/director transactions through the business account.
- Negative balances on accounts that shouldn't go negative.

Each finding: date, reference, amount, why it's flagged, suggested query or action.

## Journal Controls (fail closed)

A proposed journal is refused, not "fixed quietly", when it is:

- **Unbalanced**: total debits differ from total credits.
- **A possible duplicate** of a journal already posted (same accounts, amount, date,
  reference).
- **In a locked or closed period.**
- **Approved by its own preparer.** Maker-checker: the person who prepared a journal,
  reconciliation or report can't be the one who approves it. Approver comes from the
  sign-off policy in `opskeep-accounting-manage`; a sole practitioner is their own
  reviewer, and the output says so.

## Close Checklist (default, replace with the practice's own)

Month-end: all accounts reconciled; suspense cleared or explained; sales and purchase
ledgers agree to control accounts; payroll posted and agreed; accruals and prepayments
reviewed; recurring journals posted; sales-tax/VAT control account agreed; period
reviewed by the accountant; period locked.

Year-end adds: fixed-asset register agreed and depreciation posted; stock agreed to count;
debtor and creditor listings agreed; loans agreed to statements; post-year-end events
reviewed.

## Output Shape

```md
Close: [client] - [period]

Reconciliation: [account] at [date] ([currency])
Statement balance            [x]  (source)
Less unpresented payments   ([x])
Add outstanding deposits      [x]
Adjusted bank balance         [x]
Ledger balance               [x]  (source)
Add/less not-yet-recorded    [x]
Adjusted ledger balance       [x]
Unexplained difference        [x]

Review findings
- [date] [ref] [amount] - [why flagged] - [query/action]

Proposed journals (Needs your approval)
| Dr | Cr | Amount | Reason |

Checklist: [n] done, [n] open, [n] blocked ([by what])
Next action: [owner] - [action] - [date]
```
