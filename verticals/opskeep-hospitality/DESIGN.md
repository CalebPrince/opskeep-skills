# Opskeep Hospitality — design principles

Status: built. See [`skills/`](skills) for the eight implemented skills and
[`README.md`](README.md) for install instructions. This document proposes a lane
structure for restaurants and similar service-on-the-spot hospitality businesses, sibling
to the core Opskeep pack and to [`opskeep-retail`](../opskeep-retail/DESIGN.md) rather
than a variant of either. See root [DESIGN.md](../../DESIGN.md) for the pattern this
forks from.

## Why a separate pack instead of reusing retail

Restaurants share retail's stock-and-sell shape (order ingredients, sell dishes, repeat)
but the unit of service is fundamentally different: a table cycle spans reservation,
seating, ordering, kitchen execution, and payment in one continuous, time-pressured
interaction, not a discrete POS transaction. Food carries safety/compliance obligations
retail doesn't have at the same intensity (temperature logs, allergen disclosure,
inspections). Those differences are enough to warrant its own pack rather than branching
`opskeep-retail`'s "sell" lane to cover both.

## The six lanes

Same loop shape as the root pack and `opskeep-retail`: a continuous cycle, not a funnel,
where "improve operations" feeds back into the next "stock up."

1. **Stock up**: ingredient ordering, par levels, invoice-vs-delivery reconciliation
2. **Plan service**: weekly menu, prep list, shift rota
3. **Serve**: reservation/table flow, kitchen ticket execution, order-taking
4. **Get paid**: nightly close-out, tips split, delivery-platform fee reconciliation
5. **Keep customers**: review requests, complaint recovery, regulars/loyalty tracking
6. **Improve operations**: food cost %, waste log, labor % of sales, inspection readiness

Each lane is owned by exactly one skill, same rule as the root design. A lane skill may
read context from another lane (e.g., `opskeep-hospitality-get-paid` reading portion costs
set in `opskeep-hospitality-plan-service`) but never duplicates another lane's workflow.

## Skill map (proposed names)

| Skill | Lane / role |
| --- | --- |
| `opskeep-hospitality` | Core router, mirrors `opskeep` |
| `opskeep-hospitality-stock-up` | Stock up |
| `opskeep-hospitality-plan-service` | Plan service |
| `opskeep-hospitality-serve` | Serve |
| `opskeep-hospitality-get-paid` | Get paid |
| `opskeep-hospitality-keep-customers` | Keep customers |
| `opskeep-hospitality-improve-operations` | Improve operations |
| `opskeep-hospitality-manage` | Meta: venue profile, suppliers, staff, POS/reservation/delivery connector setup |

## What reuses Opskeep as-is vs. what forks

Same reuse logic as `opskeep-retail`, applied to this vertical:

- **Reuse directly**: `opskeep-tools` and its breakout skills (`opskeep-audio-brief`,
  `opskeep-huddle-beta`, `opskeep-follow-up-reminders`, `opskeep-time-tracking`,
  `composio-mcp`). A shift manager doing a voice huddle or setting a recurring prep
  reminder needs the same utility a consultant or a shop owner does.
- **Fork**: `opskeep-manage` assumes service-business onboarding fields. A restaurant's
  operating context is cuisine/covers, staff roles and certifications, and
  POS/reservation/delivery-platform connectors instead — `opskeep-hospitality-manage`
  owns that.
- **New, hospitality-only**: the six lane skills above are written fresh against the
  restaurant service loop; no service-business or retail equivalent fits closely enough
  to fork from.

## Two meta surfaces

- **`opskeep-hospitality-manage`**: venue setup, cuisine/menu profile, staff roster and
  certifications, POS/reservation/delivery connector setup, preferences. "Operating the
  restaurant's Opskeep," not "running the restaurant."
- **`opskeep-tools`** (shared, not forked): standalone utilities useful outside a lane
  workflow, unchanged from the root pack.

## Routing philosophy

Same as the root router: `opskeep-hospitality` is a thin dispatcher. It should recognize
which lane a request belongs to, hand off with enough context that the target skill
doesn't need to re-ask, and default to a clarifying question over guessing when the lane
is ambiguous.

## Output philosophy

Every skill ends with something concrete: a purchase order draft, a prep list and rota, a
nightly reconciliation number, a review-request send. "Food cost looked high this week" is
not a satisfying output on its own; "here's the three dishes whose ingredient cost rose
past target margin, with the new plate cost" is.

## Per-lane sketch: concrete inputs and outputs

| Lane | Gathers | Produces |
| --- | --- | --- |
| Stock up | Par levels, prep usage, supplier delivery schedule | Purchase order draft per supplier, ready to send |
| Plan service | Upcoming reservations/covers, ingredient availability, staff availability | Prep list and shift rota for the week |
| Serve | Reservation/table events, kitchen ticket status | Table status, wait-time flags, kitchen bottleneck alerts |
| Get paid | POS close-out, tips pool, delivery-platform payouts, supplier invoices | Nightly reconciliation, tips split, bills due |
| Keep customers | Reservation history, review/complaint signals | Review-request send, complaint-recovery draft, regulars outreach |
| Improve operations | Recipe cost data, waste log, labor hours vs. sales, inspection checklist | Plate-cost adjustment, waste-reduction note, inspection-readiness status |

## Safety and compliance — a cross-cutting concern, not a lane

Food safety and labor compliance (temperature logs, allergen disclosure, tip-pooling
rules, scheduling law) touch multiple lanes but aren't a lane of their own — they're a
constraint every relevant lane skill should respect:

- `opskeep-hospitality-stock-up` and `-serve` should surface temperature/allergen flags
  as part of their normal output, not as separate compliance reports.
- `opskeep-hospitality-get-paid` should flag tip-pooling and overtime concerns rather than
  resolve them; labor law varies by jurisdiction and this is not a place to guess.
- `opskeep-hospitality-improve-operations` owns inspection-readiness tracking as one of
  its concrete outputs (see table above), not general compliance advice.

## Decisions made when building

1. **POS/reservation/delivery connector set** — resolved as: don't hardcode any
   platform. Every lane skill routes live reads/writes through `composio-mcp` discovery
   (shared with the core pack). Toast/Square/OpenTable/Resy/Uber Eats/DoorDash are named
   only as examples in `opskeep-hospitality-manage`, not assumed integrations. Same
   resolution as `opskeep-retail`.
2. **Daypart and multi-location scoping** — resolved as: single-venue, single continuous
   service is the default assumption across all eight skills. Each lane skill's Gotchas
   say to ask which daypart/location before acting if that context is present.
   `opskeep-hospitality-manage` captures daypart/location count during setup. No per-lane
   scoping system was built; that's still open if real usage shows it's needed.
3. **Compliance boundary** — resolved as: every relevant lane skill surfaces
   temperature/allergen/tip-pooling/overtime flags as part of normal output, but none of
   them adjudicate legality or compliance. `opskeep-hospitality-get-paid` applies a
   venue's *stated* tip policy without judging it; `opskeep-hospitality-improve-operations`
   tracks inspection readiness as checklist status, not a pass/fail legal call. This is
   written directly into each affected skill's Boundaries section, not left as a general
   principle.
4. **Hosted vs. open-source split** — resolved as: no hosted infra was built for this
   pack. All eight skills are pure workflow/prompt skills, no invented credentials or
   gateway endpoints, same resolution as `opskeep-retail`.

## Remaining open question

**Location** — skills live in `verticals/opskeep-hospitality/skills/`, staged separately
from the core pack's `skills/` and from `opskeep-retail`'s skills. See
[`README.md`](README.md) for install instructions.

## Status

Built. All eight skills exist, are lint-clean, and follow the same output-contract
discipline as the core pack and `opskeep-retail`. Not yet validated against a real
venue's day-to-day workflow — that's the next gate before calling this
production-ready, same bar every other build in this repo has been held to before
shipping.
