---
name: opskeep-accounting
description: "Use when the user invokes Opskeep Accounting, or is an accountant, bookkeeper or finance person working across client entities, and needs routing across practice work: engage a client, collect records, close the books, track compliance deadlines, report the numbers; or Opskeep Accounting Manage for practice setup, client roster and connectors. Routes the practice's own billing, client care and SOPs to the core Opskeep lanes, and time/expense capture to opskeep-tools."
metadata:
  lane: meta
  version: 0.1.0
  pack_version: 0.2.0
---

# Opskeep Accounting

Opskeep Accounting routes the client-work loop of an accounting or bookkeeping practice.
See [`DESIGN.md`](../../DESIGN.md) for the lane model and professional boundaries this
router enforces.

Choose one primary destination, hand off to that skill, return sources, owners, next
actions, and `TBD` for unknowns.

## Workflow

1. **Classify the request.** Client accounting work, the practice's own business
   (billing, client care, SOPs), managing Opskeep Accounting, a shared Opskeep tool,
   explicit help/menu, or not an Opskeep Accounting task.
2. **Pick one primary destination** from the matrix, rules and tie-breakers below.
3. **Name the client and period.** Most lanes act on one client entity and one period.
   If either is unclear and more than one is plausible, ask one question first.
4. **Load the destination skill** and keep its approval gates and output contract.
5. **Use connectors only when needed.** Setup/status -> `opskeep-accounting-manage`.
   Live ledger/bank/app reads or writes -> `opskeep-tools`/`composio-mcp` with discovery.
6. **Return the smallest useful next step.**

## Command Matrix

| Group | Commands and aliases | Primary route |
|---|---|---|
| Engage | `engage`, `finance health check`, `finance assessment`, `engagement letter`, `new client`, `onboard client`, `KYC`, `AML`, `scope of services`, `fee basis` | `opskeep-accounting-engage` |
| Collect | `collect`, `request list`, `PBC`, `missing documents`, `chase records`, `bank statements`, `receipts`, `records request` | `opskeep-accounting-collect` |
| Close | `close`, `month-end`, `year-end close`, `bank reconciliation`, `reconcile`, `bookkeeping review`, `trial balance`, `suspense`, `accruals`, `journal` | `opskeep-accounting-close` |
| Deadlines | `deadlines`, `compliance calendar`, `filing due`, `due dates`, `overdue filing`, `VAT return`, `tax return due`, `payroll filing`, `annual return` | `opskeep-accounting-deadlines` |
| Report | `report`, `management accounts`, `management report`, `variance`, `P&L commentary`, `cash position`, `KPI`, `board pack` | `opskeep-accounting-report` |
| Practice billing (core) | `invoice the client`, `our fees`, `WIP`, `unbilled time`, `retainer`, `aged debtors`, `who owes us`, `write-off` | `opskeep-get-paid` |
| Client care (core) | `check-in`, `renewal`, `client health`, `referral`, `testimonial` | `opskeep-keep-clients` |
| Practice SOPs (core) | `SOP`, `checklist template`, `retrospective`, `lessons from busy season` | `opskeep-improve-operations` |
| Manage Opskeep Accounting | `setup`, `practice profile`, `client roster`, `add client entity`, `connect QuickBooks/Xero/Sage`, `connector`, `sign-off policy` | `opskeep-accounting-manage` |
| Opskeep Tools (shared) | `time tracking`, `log time`, `expense tracking`, `log expense`, `follow-up reminder`, `audio brief`, `voice session`, `composio` | `opskeep-tools` |
| Updates | `what's new`, `update opskeep`, `stop update notices` | Update Notice section below |
| Help | `help`, `menu`, sparse context, unsafe/unknown route | show the menu below |

## Routing Rules

1. Known command/alias -> matching route. No command but clear context -> route by intent.
2. Work on a client's books or compliance -> an accounting lane. Work on the practice's own
   money, clients or processes -> the core lane named in the matrix.
3. Core lanes are a separate install (the core Opskeep pack). If one isn't installed,
   say so and give `npx skills add CalebPrince/opskeep-skills`; don't improvise its
   output.
4. Live ledger, bank-feed or practice-management reads/writes go through
   `opskeep-tools`/`composio-mcp`. Never guess connector slugs.
5. Multiple matches -> one primary destination plus secondary follow-ups.
6. Tax advice, a filing position or an accounting-treatment decision is the accountant's
   call. Prepare the facts and options with sources, mark it `Needs your review`, and do
   not decide it.

## Tie-Breakers

- `reconcile` -> `close`. `reconcile what the client paid us` -> core `get paid`.
- `VAT`/`tax return` -> `deadlines` for when it's due and prep status; `close` for the
  ledger work behind it; the return itself is prepared and filed by the accountant.
- `missing receipts` -> `collect` to chase; `close` when the question is how to treat the
  unexplained item in the ledger.
- `onboard client` -> `engage` for the client entity; `opskeep-accounting-manage` only to
  add the entity to the roster after engagement.
- `report` for the client's figures -> `report`. A status update on the job itself
  ("where are we on Mensah's year-end?") -> core `deliver work`.
- `expense` the practice spent on a client job (filing fees, travel) -> `opskeep-tools` to
  `opskeep-expense-tracking`. A client's own expense in their ledger -> `close`.

## Help

```md
Opskeep Accounting helps run a practice's client work.

Client work:
- `engage` - finance health check, engagement scope, onboarding/KYC checklist, fee basis.
- `collect` - document request lists, chase missing records.
- `close` - reconciliations, bookkeeping review, month-end checklist.
- `deadlines` - every client's upcoming and overdue filings.
- `report` - management-accounts commentary, variances, cash.

Your practice (core Opskeep):
- `get paid` - fees, WIP, retainers, aged debtors.
- `keep clients` - check-ins, renewals, referrals.
- `improve operations` - SOPs and checklists.

Setup: `setup`, `client roster`, `connect accounting software`
Tools: `log time`, `log expense`, `follow-up reminder`

Decision stub: next action, owner, date, evidence. Use `TBD` when missing.
```

## Gotchas

- Do not route generic spreadsheet, coding or research work into Opskeep Accounting.
- Do not edit/copy internals of `opskeep-tools` or its breakout skills.
- Do not invent balances, deadlines, tax rates, thresholds, client names or entity
  details. Use `TBD`.
- Never mix two clients' figures or documents in one output unless the user asks for a
  practice-wide view (for example a deadline calendar across clients).
- Never submit, file or pay anything with an authority or bank.

## Update Notice

Once a day, after answering (never before), check for a newer version:

1. Skip if `~/.opskeep/update-check.json` shows `lastChecked` is today or `notices` is
   `off`, or there's no web access.
2. Fetch `https://raw.githubusercontent.com/CalebPrince/opskeep-skills/main/whats-new.json`
   and compare its `version` (as numbers) to `metadata.pack_version` above. Save today
   as `lastChecked`.
3. Newer and not yet announced (`lastNotifiedVersion`): end the reply with
   `There's a newer version of Opskeep. [headline]`, the `highlights` as bullets, and
   `Want me to install it for you? Just say "yes, update Opskeep".` Plain words only: no
   version numbers, GitHub, git or commands unless asked. Save `lastNotifiedVersion`.
4. On yes: pull the pack's clone folder and copy `verticals/opskeep-accounting/skills/*` into the
   agent's skills folder again (if the folder is unknown, offer to download a fresh
   copy), and run `packs.core.update` for the core skills. Never touch the user's
   records in `~/.opskeep/`. "Stop telling me" sets `notices` to `off`.
