# Opskeep Retail — design principles

Status: sketch. Not built. This document proposes a lane structure for stock-and-sell
businesses (boutiques, fashion, general retail), sibling to the service-business Opskeep
pack rather than a variant of it. See root [DESIGN.md](../../DESIGN.md) for the pattern
this forks from.

## Why a separate pack instead of new lanes on Opskeep

Opskeep's six lanes assume a project-based service loop: win an engagement, scope it,
deliver it, invoice it. A retail shop's loop is stock-and-sell, running continuously
rather than per-engagement, with different concrete artifacts at every step (a reorder
draft instead of a proposal, a till reconciliation instead of an invoice). Bending the
existing lane skills to cover both would blur what each one owns. A sibling pack with the
same loop *shape* keeps both packs legible on their own.

## The six lanes

Retail models a shop as a loop, not a funnel, same as Opskeep: what you learn in "improve
operations" changes how the next cycle plays out in "stock up."

1. **Stock up**: sourcing, purchasing, supplier ordering, reorder points, SKU/variant intake
2. **Plan the drop**: pricing, merchandising calendar, seasonal launches, markdown planning
3. **Sell**: POS transactions, in-store/online fulfillment sync, order handoff
4. **Get paid**: till reconciliation, refunds/exchanges, supplier bill payment, margin
5. **Keep customers**: loyalty programs, review requests, restock-alert outreach, repeat-visit nudges
6. **Improve operations**: sell-through by SKU, markdown effectiveness, shrinkage, reorder-point tuning

Each lane is owned by exactly one skill. A lane skill may read context from another lane
(e.g., `opskeep-retail-get-paid` reading margin targets set in `opskeep-retail-plan-drop`)
but should never duplicate another lane's workflow — same rule as the root design.

## Skill map (proposed names)

| Skill | Lane / role |
| --- | --- |
| `opskeep-retail` | Core router, mirrors `opskeep` |
| `opskeep-retail-stock-up` | Stock up |
| `opskeep-retail-plan-drop` | Plan the drop |
| `opskeep-retail-sell` | Sell |
| `opskeep-retail-get-paid` | Get paid |
| `opskeep-retail-keep-customers` | Keep customers |
| `opskeep-retail-improve-operations` | Improve operations |
| `opskeep-retail-manage` | Meta: shop profile, suppliers, staff, POS/connector setup |

## What reuses Opskeep as-is vs. what forks

Not every meta surface needs a retail-specific rebuild:

- **Reuse directly**: `opskeep-tools` and its breakout skills (`opskeep-audio-brief`,
  `opskeep-huddle-beta`, `opskeep-follow-up-reminders`, `opskeep-time-tracking`,
  `composio-mcp`) are generic hosted utilities with no service-business assumptions baked
  in. A shop manager doing a live voice huddle or setting a recurring reminder needs the
  same thing a consultant does.
- **Fork**: `opskeep-manage` assumes service-business onboarding fields (services,
  clients, project cadence). A retail shop's operating context is products, suppliers,
  staff, and POS/inventory connectors instead — different enough to need
  `opskeep-retail-manage` as its own skill rather than branching the existing one.
- **New, retail-only**: the six lane skills above have no service-business equivalent
  worth forking from; they're written fresh against the retail loop.

## Two meta surfaces

- **`opskeep-retail-manage`**: shop setup, product/supplier profile, staff roster, POS and
  inventory connector setup, preferences. "Operating the shop's Opskeep," not "running the
  shop."
- **`opskeep-tools`** (shared, not forked): standalone utilities useful outside a lane
  workflow, unchanged from the root pack.

## Routing philosophy

Same as the root router: `opskeep-retail` is a thin dispatcher. It should recognize which
lane a request belongs to, hand off with enough context that the target skill doesn't need
to re-ask, and default to a clarifying question over guessing when the lane is ambiguous.

## Output philosophy

Every skill ends with something concrete: a reorder draft, a markdown price change, a till
reconciliation number, a loyalty-outreach send. "Sales look soft this week" is not a
satisfying output on its own; "here's the reorder for the three SKUs below their reorder
point, ready to send to the supplier" is.

## Per-lane sketch: concrete inputs and outputs

| Lane | Gathers | Produces |
| --- | --- | --- |
| Stock up | Current stock levels, sales velocity, supplier lead times | Reorder draft with quantities and supplier, ready to send |
| Plan the drop | Season/calendar, target margin, prior sell-through | Pricing sheet and launch calendar for the cycle |
| Sell | POS/order events, fulfillment channel | Fulfillment status, exceptions flagged (oversell, backorder) |
| Get paid | Till totals, refund/exchange log, supplier invoices | Daily reconciliation, flagged discrepancies, bills due |
| Keep customers | Purchase history, review/loyalty signals | Loyalty outreach draft, review-request send, win-back list |
| Improve operations | Sell-through, markdown history, shrinkage log | Reorder-point adjustments, markdown-timing note, SKU retire/keep call |

## Open questions before building

1. **POS/inventory connector set** — which platforms (Shopify, Square, Lightspeed) are
   must-have for v1 vs. later.
2. **Multi-location** — sketch above assumes one shop; multi-location adds a scoping
   dimension to every lane (which location's stock, whose till).
3. **Hosted vs. open-source split** — does retail follow the same tiering as
   [PRODUCT.md](../../PRODUCT.md) (hosted connectors/automation as Pro), or does POS
   integration require hosted infra from day one given real-time inventory sync?

## Status

Sketch only. No skills have been written against this design. Promote lane-by-lane into
`skills/` (or a `verticals/opskeep-retail/skills/` staging area, to be decided) once the
open questions above are resolved and the first lane is validated with a real shop
workflow.
