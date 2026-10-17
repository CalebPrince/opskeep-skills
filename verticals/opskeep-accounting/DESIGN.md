# Opskeep Accounting — design principles

Status: built. See [`skills/`](skills) for the seven implemented skills and
[`README.md`](README.md) for install instructions. This pack is for accounting and
bookkeeping practices (sole practitioners, small firms, in-house finance people who look
after several entities), sibling to the core service-business Opskeep pack. See root
[DESIGN.md](../../DESIGN.md) for the pattern this forks from.

## Why a separate pack instead of new lanes on Opskeep

An accounting practice *is* a service business, so the core pack already fits how the
practice runs itself: winning clients, getting paid, keeping clients, writing SOPs. What
the core pack doesn't cover is the recurring client-work loop that sits between "client
signed" and "invoice sent": chasing records, closing the books every month, keeping every
client's filing deadlines visible, and turning the numbers into a report the client can
act on. That loop runs per client, per period, forever, not per engagement, and its
concrete artifacts (a document request list, a bank reconciliation, a deadline calendar,
a management-report commentary) have no core-lane equivalent. A sibling pack keeps both
legible.

## The loop

1. **Engage**: engagement letter scope, client onboarding/KYC checklist, fee basis
2. **Collect**: document request lists, missing-records chasing, receipt/statement intake
3. **Close**: bookkeeping review, bank/ledger reconciliation, month-end close checklist
4. **Deadlines**: per-client compliance calendar, upcoming and overdue filings
5. **Report**: management accounts commentary, variance, cash position, KPIs

"Get paid", "keep clients" and "improve operations" for the practice itself reuse the core
pack's `opskeep-get-paid`, `opskeep-keep-clients` and `opskeep-improve-operations` instead
of forking them. What a practice learns closing one month changes what it asks for in the
next month's request list, so the loop feeds back into "collect".

## Skill map

| Skill | Lane / role |
| --- | --- |
| `opskeep-accounting` | Core router, mirrors `opskeep` |
| `opskeep-accounting-engage` | Engage |
| `opskeep-accounting-collect` | Collect |
| `opskeep-accounting-close` | Close |
| `opskeep-accounting-deadlines` | Deadlines |
| `opskeep-accounting-report` | Report |
| `opskeep-accounting-manage` | Meta: practice profile, client roster, accounting-software connectors, review policy |

## What reuses Opskeep as-is vs. what forks

- **Reuse directly**: `opskeep-get-paid` (practice fees, WIP, retainers, aged debtors),
  `opskeep-keep-clients`, `opskeep-improve-operations`, and `opskeep-tools` with its
  breakout skills (time tracking, expense tracking, follow-up reminders, Composio).
- **Fork**: `opskeep-manage` assumes generic service onboarding. A practice's operating
  context is a client roster with entity types, year-ends, registrations, the
  accounting software each client uses, and who signs off work, so it gets
  `opskeep-accounting-manage`.
- **New, accounting-only**: the five lane skills above.

## Professional boundaries (apply to every skill)

1. **The accountant is the professional; the agent is the assistant.** Skills prepare,
   check, draft and track. They never sign off accounts, choose an accounting treatment,
   or take a tax position on the accountant's behalf. Judgement calls are surfaced as
   `Needs your review`, not decided.
2. **No filing or submission.** No skill submits a return, payment or filing to a tax
   authority, regulator, registrar or bank. The most a skill does is prepare the pack
   and the checklist.
3. **No invented statutory dates or rates.** Deadlines, tax rates and thresholds change
   by jurisdiction and year. They come from the practice's own calendar, the user, or an
   official source checked at the time and cited with the date it was checked. Never
   from memory.
4. **Client confidentiality.** Client figures and documents stay inside the client's own
   work. No skill copies one client's data into another client's output, and outbound
   messages are drafts until approved.
5. **Every figure has a source.** A number in any output names the ledger, statement,
   report or user message it came from, or it's `TBD`.

## Per-lane sketch: concrete inputs and outputs

| Lane | Gathers | Produces |
| --- | --- | --- |
| Engage | Services wanted, entity type, fee basis, client identity documents | Scope-of-services list for the engagement letter, onboarding checklist, fee basis handed to get-paid |
| Collect | Period, services, what's already received | Document request list, chase drafts, received/missing tracker |
| Close | Bank statements, ledger/trial balance, close checklist | Reconciliation with unexplained differences, close checklist status, review queries |
| Deadlines | Client roster, registrations, practice calendar | Upcoming/overdue deadline list with owner and prep status |
| Report | Period figures, prior period/budget, client goals | Report commentary, variance table, cash position, questions for the client |

## Decisions made when building

1. **Accounting-software connectors**: no platform is hardcoded. QuickBooks, Xero, Sage,
   Zoho Books, Tally and spreadsheets are named only as examples in
   `opskeep-accounting-manage`; live reads go through `composio-mcp` discovery.
2. **Jurisdiction**: none assumed. `opskeep-accounting-manage` records the practice's
   country and each client's, plus currency. Deadline rules are entered by the practice
   (or verified from the official source), not shipped in the pack.
3. **Hosted vs. open-source**: no new hosted infrastructure. Time and expense capture
   reuse the existing `opskeep-tools` utilities.
4. **Autonomy**: none. Every outbound message and every ledger write holds for approval.

## Status

Built and lint-clean. Not yet validated against a real practice's month-end; treat lane
content as a strong first draft.
