# Opskeep Accounting

**Operations skills for an accounting or bookkeeping practice, built on the same loop
shape as [Opskeep](../../README.md).**

Engage the client, collect their records, close the books, keep every deadline visible,
report the numbers, and get paid for it. Opskeep Accounting installs that loop directly
into your agent. You stay the professional: the skills prepare, check, draft and track,
and every judgement call, sign-off and filing stays with you.

Sibling pack to the core Opskeep pack. See [`DESIGN.md`](DESIGN.md) for why the
client-work loop gets its own pack and which core skills it reuses.

## Install

```bash
# Accounting pack
git clone https://github.com/CalebPrince/opskeep-skills.git
cp -r opskeep-skills/verticals/opskeep-accounting/skills/* .agents/skills/

# Plus the core skills it reuses (practice billing, client care, SOPs, time and expenses)
npx skills add CalebPrince/opskeep-skills
```

The core pack is needed alongside this one: the practice's own fees, WIP, retainers and
aged debtors run through core `opskeep-get-paid`, and time/expense capture runs through
`opskeep-time-tracking` and `opskeep-expense-tracking`.

## Skills

| Skill | Description |
| --- | --- |
| `opskeep-accounting` | Router for practice work, accounting setup, and shared Opskeep tools. |
| `opskeep-accounting-engage` | Engagement-letter scope of services, client onboarding/KYC checklist, fee basis. |
| `opskeep-accounting-collect` | Document request lists, missing-records chasing, received/missing tracker. |
| `opskeep-accounting-close` | Bank and ledger reconciliation, bookkeeping review, month-end close checklist. |
| `opskeep-accounting-deadlines` | Per-client compliance calendar, upcoming and overdue filings. |
| `opskeep-accounting-report` | Management-accounts commentary, variances, cash position, KPIs. |
| `opskeep-accounting-manage` | Practice profile, client roster, accounting-software connectors, sign-off policy. |

## What it will not do

- Sign off accounts, pick an accounting treatment, or take a tax position for you.
- Submit anything to a tax authority, regulator, registrar or bank.
- Use a statutory deadline, tax rate or threshold from memory. Those come from your own
  calendar or an official source checked at the time.
- Send a client message without your approval.

## Connector approach

No accounting platform is hardcoded. Live reads go through `composio-mcp` discovery, so
the pack works with whatever you have connected (QuickBooks, Xero, Sage, Zoho Books,
Tally, or plain spreadsheets and PDFs you share in the conversation).

## Status

Built and lint-clean. Not yet validated against a real practice's month-end; treat lane
content as a strong first draft.

## License

MIT, same as the root pack: see [LICENSE](../../LICENSE).
