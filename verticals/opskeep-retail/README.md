# Opskeep Retail

**Operations skills for running a shop, built on the same loop shape as
[Opskeep](../../README.md).**

Stock up, plan what you're selling, sell it, get paid, keep the customer, and get better
at all of it next cycle. Opskeep Retail installs that loop directly into your agent.

Sibling pack to the core Opskeep pack, not a variant of it — see [`DESIGN.md`](DESIGN.md)
for why retail's stock-and-sell loop gets its own pack instead of reusing Opskeep's
project-based lanes.

## Install

```bash
git clone https://github.com/CalebPrince/opskeep-skills.git
cp -r opskeep-skills/verticals/opskeep-retail/skills/* .agents/skills/
```

This pack is staged separately from the core Opskeep pack (`skills/` at the repo root) so
installing it never bundles retail-specific skills into a service-business install, and
vice versa. `opskeep-tools` and its breakout skills (audio briefs, huddles, follow-up
reminders, time tracking, expense tracking, Composio access) are reused as-is from the
core pack — copy `skills/opskeep-tools` and the breakout skills you want alongside this
pack's skills if you're installing it standalone.

## Skills

| Skill | Description |
| --- | --- |
| `opskeep-retail` | Core router for shop work, Opskeep Retail setup, and shared Opskeep tools. |
| `opskeep-retail-stock-up` | Reorder drafts, supplier ordering, SKU/variant intake, low-stock flags. |
| `opskeep-retail-plan-drop` | Pricing, merchandising calendar, seasonal launches, markdown timing. |
| `opskeep-retail-sell` | Transaction/fulfillment status, in-store/online sync, oversell/backorder flags. |
| `opskeep-retail-get-paid` | Till reconciliation, refunds/exchanges, supplier bill payment, margin. |
| `opskeep-retail-keep-customers` | Loyalty outreach, review requests, restock alerts, win-back lists. |
| `opskeep-retail-improve-operations` | Sell-through review, markdown effectiveness, shrinkage, reorder-point tuning. |
| `opskeep-retail-manage` | Shop setup: product/supplier profile, staff roster, POS/inventory connectors. |

## Connector approach

No specific POS or inventory platform is hardcoded into any skill. Live reads/writes go
through `composio-mcp` discovery (shared with the core Opskeep pack), so the pack works
with whatever the shop actually has connected rather than assuming Shopify, Square,
Lightspeed, or any other named platform. See
[`opskeep-retail-manage/references/connectors.md`](skills/opskeep-retail-manage/references/connectors.md).

## Status

Built: all eight skills are lint-clean and follow the same output-contract discipline as
the core Opskeep pack (concrete artifacts, `TBD` for unknowns, confirmation gates before
external writes). Not yet validated against a real shop's day-to-day workflow — treat
lane content as a strong first draft, not a finished product. See
[`DESIGN.md`](DESIGN.md) for open questions and what "done" looks like next.

## License

MIT, same as the root pack: see [LICENSE](../../LICENSE).
