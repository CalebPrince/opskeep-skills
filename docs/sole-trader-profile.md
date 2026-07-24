# Sole trader profile — coverage sketch

Status: sketch, not wired into any skill yet. Unlike `verticals/opskeep-retail` and
`verticals/opskeep-hospitality`, this is not a sibling pack proposal.

## Why sole trader isn't a new vertical

A sole trader — electrician, plumber, mobile hairdresser, personal trainer, freelance
designer, handyman — runs the same loop Opskeep already models: get leads, quote/scope
the job, do the work, get paid, keep the client, get better at it next time. That's
project-based service work, the exact shape of Opskeep's six core lanes. Retail and
hospitality needed their own packs because a continuous stock-and-sell or table-service
loop doesn't map onto "define work → deliver work"; a sole trader's does, with no fork
required.

So the right unit here isn't a new lane taxonomy — it's a set of light adjustments to the
four existing skills where a solo, often on-site operator differs from the
consultant/agency default Opskeep is written against, plus one real gap.

## Where the differences land

| Existing skill | Sole-trader adjustment |
| --- | --- |
| `opskeep-define-work` | A quote for a single job stands in for a full proposal; skip RACI/stakeholder mapping unless the client explicitly has multiple decision-makers. |
| `opskeep-deliver-work` | Delivery is typically a single visit or short on-site run, not a multi-week engagement; "handoff" and "dependency" tracking rarely apply solo. |
| `opskeep-get-paid` | Mileage and job materials are core cost inputs to billable time/budget, not an edge case, since margin on a physical job depends on them directly. |
| `opskeep-keep-clients` | Referral tracking matters more than renewal tracking — most trades don't run recurring contracts, they get repeat and referred jobs. |

These are candidates for short `references/sole-trader.md` additions inside each of those
four skills (per the `docs/` convention: one topic file, linked from the relevant skills)
once validated, not new skill files.

## The one real gap: mileage/job-expense tracking

Everything else above is a framing adjustment to an existing skill. This one is missing
entirely: a tradesperson needs to capture a mileage log or a materials receipt and tag it
to a specific job, so it rolls into that job's `opskeep-get-paid` invoice. Today there's no
skill or `opskeep-tools` breakout that does this — `opskeep-time-tracking` covers billable
hours but not mileage or job materials.

This overlaps the "expense tracking" gap already flagged as a candidate `opskeep-tools`
breakout skill in earlier scoping. Sketch, if built:

- Capture: a receipt photo/description or a mileage entry, tagged to a job/client, same
  interaction shape as `opskeep-time-tracking`'s backfill.
- Store: running expense total per job (mirrors the MCP scaffold pattern used for
  reminders and time entries — in-memory, `TODO` for real receipt-OCR/storage).
- Output: expense line items ready to fold into that job's invoice via `opskeep-get-paid`.

## Open questions

1. Do the four adjustment notes above get written as real `references/sole-trader.md`
   files now, or wait until a real sole-trader workflow validates them (same "validate
   before promoting" bar used for `prototypes/`)?
2. Should mileage/job-expense tracking be its own `opskeep-tools` breakout, or folded into
   a broader `opskeep-expense-tracking` skill alongside non-mileage expenses?
3. Where's the line between "sole trader" and "small team"? A two-person plumbing outfit
   blurs this; past a certain team size these adjustments stop applying and it's just
   default Opskeep.

## Status

Sketch only. Recommendation: don't build a new pack for this. If anything ships, it's (a)
four short reference notes on existing skills, and (b) a possible new `opskeep-tools`
breakout for mileage/job-expense capture — both smaller than a `verticals/` fork.
