# Sole trader profile — coverage sketch

Status: built. Unlike `verticals/opskeep-retail` and `verticals/opskeep-hospitality`, this
was never a sibling pack proposal — it shipped as reference notes on existing skills plus
one new breakout skill.

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

## Where the differences landed

| Existing skill | Sole-trader adjustment | Reference |
| --- | --- | --- |
| `opskeep-define-work` | A quote for a single job stands in for a full proposal; skip RACI/stakeholder mapping unless the client explicitly has multiple decision-makers. | [`references/sole-trader.md`](../skills/opskeep-define-work/references/sole-trader.md) |
| `opskeep-deliver-work` | Delivery is typically a single visit or short on-site run, not a multi-week engagement; "handoff" and "dependency" tracking rarely apply solo. | [`references/sole-trader.md`](../skills/opskeep-deliver-work/references/sole-trader.md) |
| `opskeep-get-paid` | Mileage and job materials are core cost inputs to billable time/budget, not an edge case, since margin on a physical job depends on them directly. | [`references/sole-trader.md`](../skills/opskeep-get-paid/references/sole-trader.md) |
| `opskeep-keep-clients` | Referral tracking matters more than renewal tracking — most trades don't run recurring contracts, they get repeat and referred jobs. | [`references/sole-trader.md`](../skills/opskeep-keep-clients/references/sole-trader.md) |

## The gap that's now closed: mileage/job-expense tracking

Built as its own breakout skill, [`opskeep-expense-tracking`](../skills/opskeep-expense-tracking/SKILL.md),
answering open question 2 below in favor of a dedicated skill rather than folding into
`opskeep-get-paid` — same reasoning as `opskeep-time-tracking`: capture is a distinct,
repeated interaction from invoicing, so it's cleaner as its own tool that `opskeep-get-paid`
reads from.

- Capture: `log_expense` — a materials/mileage/other cost tagged to a job. Amount is
  always caller-supplied; the tool never invents a per-mile rate.
- Store: `list_expenses` / `summarize_expenses` (mirrors the MCP scaffold pattern used for
  reminders and time entries — in-memory, resets on restart, `TODO` for real
  receipt-OCR/storage).
- Output: `summarize_expenses` totals by category, ready to fold into that job's invoice
  via `opskeep-get-paid`.

## Open questions (remaining)

1. Where's the line between "sole trader" and "small team"? A two-person plumbing outfit
   blurs this; past a certain team size these adjustments stop applying and it's just
   default Opskeep.
2. Should `opskeep-expense-tracking` eventually get a hosted/Pro tier (like
   `opskeep-time-tracking`'s real gateway-backed version) once real usage validates the
   open-source scaffold, per [PRODUCT.md](../PRODUCT.md)'s tiering?

## Status

Built. Four reference notes shipped on existing skills, plus `opskeep-expense-tracking` as
a new breakout skill with its own open-source MCP scaffold. No new pack was created, per
the original recommendation.
