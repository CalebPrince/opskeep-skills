# Opskeep Hospitality

**Operations skills for running a restaurant or venue, built on the same loop shape as
[Opskeep](../../README.md).**

Stock up, plan service, serve, get paid, keep the guest, and get better at all of it next
cycle. Opskeep Hospitality installs that loop directly into your agent.

Sibling pack to the core Opskeep pack and to
[`opskeep-retail`](../opskeep-retail/README.md), not a variant of either — see
[`DESIGN.md`](DESIGN.md) for why a restaurant's table-service loop gets its own pack.

## Install

```bash
git clone https://github.com/CalebPrince/opskeep-skills.git
cp -r opskeep-skills/verticals/opskeep-hospitality/skills/* .agents/skills/
```

This pack is staged separately from the core Opskeep pack (`skills/` at the repo root) so
installing it never bundles restaurant-specific skills into a service-business install,
and vice versa. `opskeep-tools` and its breakout skills (audio briefs, huddles, follow-up
reminders, time tracking, expense tracking, Composio access) are reused as-is from the
core pack — copy `skills/opskeep-tools` and the breakout skills you want alongside this
pack's skills if you're installing it standalone.

## Skills

| Skill | Description |
| --- | --- |
| `opskeep-hospitality` | Core router for venue work, Opskeep Hospitality setup, and shared Opskeep tools. |
| `opskeep-hospitality-stock-up` | Ingredient ordering, par levels, delivery reconciliation, food-safety flags. |
| `opskeep-hospitality-plan-service` | Menu/plate pricing, prep lists, shift rota staffing. |
| `opskeep-hospitality-serve` | Reservation/table status, waitlist, kitchen ticket execution, order exceptions. |
| `opskeep-hospitality-get-paid` | Nightly close-out, tips split, delivery-platform fees, supplier bills, margin. |
| `opskeep-hospitality-keep-customers` | Review requests, complaint recovery, regulars/loyalty tracking. |
| `opskeep-hospitality-improve-operations` | Food cost %, waste log, labor % of sales, inspection readiness. |
| `opskeep-hospitality-manage` | Venue setup: cuisine/menu profile, staff roster and certifications, connectors. |

## Connector approach

No specific POS, reservation, or delivery platform is hardcoded into any skill. Live
reads/writes go through `composio-mcp` discovery (shared with the core Opskeep pack), so
the pack works with whatever the venue actually has connected rather than assuming Toast,
Square, OpenTable, Resy, Uber Eats, DoorDash, or any other named platform. See
[`opskeep-hospitality-manage/references/connectors.md`](skills/opskeep-hospitality-manage/references/connectors.md).

## Food safety and labor compliance

Handled as a cross-cutting concern, not a lane. `opskeep-hospitality-stock-up` and
`opskeep-hospitality-serve` surface temperature/allergen flags as part of normal output.
`opskeep-hospitality-get-paid` applies a venue's stated tip-pooling policy but never
judges whether it's legally compliant. `opskeep-hospitality-improve-operations` tracks
inspection-readiness as a checklist status, not a pass/fail legal determination. Every
lane skill's Boundaries/Gotchas section is explicit: surface the flag, don't adjudicate
it — that's a qualified professional's call.

## Status

Built: all eight skills are lint-clean and follow the same output-contract discipline as
the core Opskeep pack and `opskeep-retail` (concrete artifacts, `TBD` for unknowns,
confirmation gates before external writes). Not yet validated against a real venue's
day-to-day workflow — treat lane content as a strong first draft, not a finished product.
See [`DESIGN.md`](DESIGN.md) for what's still open.

## License

MIT, same as the root pack: see [LICENSE](../../LICENSE).
