---
name: opskeep-hospitality
description: "Use when the user invokes Opskeep Hospitality and needs routing across restaurant/venue operations: stock up, plan service, serve, get paid, keep customers, improve operations; or Opskeep Hospitality Manage for venue setup, connectors, and preferences. Routes to opskeep-tools for standalone hosted utilities shared with the core Opskeep pack."
lane: meta
metadata:
  version: 0.1.0
---

# Opskeep Hospitality

Opskeep Hospitality routes the work around running a restaurant or venue: stock, plan
service, serve, get paid, keep customers, and get better at all of it next cycle. See
[`DESIGN.md`](../../DESIGN.md) for the lane model this router implements.

Choose one primary destination, hand off to that skill or reference, return sources,
owners, next actions, and `TBD` for unknowns.

## Workflow

1. **Classify the request.** Decide whether this is venue work, managing Opskeep
   Hospitality, a shared Opskeep tool, explicit help/menu, or not an Opskeep Hospitality
   task.
2. **Pick one primary destination.** Use the command matrix, routing rules, and
   tie-breakers below. If no command is present, route by conversation context when safe.
3. **Load the destination.** Prefer the standalone skill named in the matrix.
4. **Check route-specific gotchas.** Use this router's gotchas plus the destination
   skill's rules before output with connector-access risk, customer-facing consequences,
   or a food-safety/labor-compliance flag.
5. **Use connectors only when needed.** For POS/reservation/delivery-platform connector
   setup or status, route to `opskeep-hospitality-manage`. For live reads/writes, route to
   `opskeep-tools`/`composio-mcp` with discovery and schema checks.
6. **Run the workflow.** Preserve required inputs, approval gates, provenance, and output
   contract. Use `TBD` for missing facts.
7. **Return the smallest useful next step.** Include secondary follow-ups only when
   useful, unless the user asks for a chain.

No command? Use conversation context to choose the best destination. Show the menu only
for explicit `help`/`menu`, sparse context, or unsafe routing. Not venue ops, Opskeep
Hospitality setup/config, or a shared Opskeep utility? Do not force Opskeep Hospitality.

## Command Matrix

| Group | Commands and aliases | Primary route |
|---|---|---|
| Stock up | `stock up`, `ingredient order`, `par level`, `supplier order`, `delivery reconciliation`, `low stock` | `opskeep-hospitality-stock-up` |
| Plan service | `plan service`, `menu`, `prep list`, `shift rota`, `staffing`, `weekly plan` | `opskeep-hospitality-plan-service` |
| Serve | `serve`, `reservation`, `table`, `waitlist`, `kitchen ticket`, `order status` | `opskeep-hospitality-serve` |
| Get paid | `get paid`, `close-out`, `till`, `tips`, `delivery platform fees`, `supplier bill`, `margin` | `opskeep-hospitality-get-paid` |
| Keep customers | `keep customers`, `review request`, `complaint`, `regulars`, `loyalty` | `opskeep-hospitality-keep-customers` |
| Improve operations | `improve operations`, `food cost`, `waste log`, `labor percent`, `inspection readiness` | `opskeep-hospitality-improve-operations` |
| Manage Opskeep Hospitality | `manage`, `setup`, `venue profile`, `supplier profile`, `staff roster`, `connect tools`, `connector`, `POS setup` | `opskeep-hospitality-manage` |
| Opskeep Tools (shared) | `audio brief`, `voice session`, `follow-up reminder`, `time tracking`, `expense tracking`, `composio`, `hosted utility` | `opskeep-tools` |
| Help | `help`, `menu`, sparse context, unsafe/unknown route | show command menu inline (see Help below) |

## Routing Rules

1. Known command/alias after Opskeep Hospitality -> matching route.
2. Exact `help` or `menu` -> show command menu.
3. No command, missing command, or unknown command with clear context -> route by intent
   instead of showing menu.
4. `opskeep-hospitality-manage` owns venue setup, cuisine/menu profile, staff roster and
   certifications, connected tools, and preferences.
5. `opskeep-tools` owns standalone hosted utilities shared with the core Opskeep pack:
   audio briefs, voice huddles, follow-up reminders, time tracking, expense tracking, and
   Composio-backed tool access. Reused as-is; this pack does not fork it.
6. Live POS/reservation/delivery-platform reads or writes go through
   `opskeep-tools`/`composio-mcp` discovery and schema rules. Never guess connector slugs.
7. Food-safety and labor-compliance flags (temperature, allergen, tip-pooling, overtime)
   are surfaced by the relevant lane, never adjudicated. See each lane skill's Boundaries.
8. Multiple matches -> one primary destination plus secondary follow-ups, unless the user
   asks for a chain.
9. Sparse or unsafe route -> help/menu plus one clarifying question only if needed.

## Tie-Breakers

- `tips` -> `get paid` for the split/reconciliation figure. Tip-pooling policy questions
  get flagged, not decided (see `opskeep-hospitality-get-paid` Boundaries).
- `menu` -> `plan service` for what's on it this cycle; `improve operations` for
  reviewing whether past menu/pricing calls worked (food cost trend).
- `reservation`/`waitlist` -> `serve` for live status; `plan service` for staffing a known
  upcoming volume of reservations.
- `complaint` -> `keep customers` for recovery; `serve` only if it's an active,
  in-the-moment service issue still unfolding.
- `inspection` -> `improve operations` for readiness tracking; `stock up`/`serve` for a
  specific temperature/allergen flag in the moment.
- `POS setup`/`connector status` -> `opskeep-hospitality-manage`. `POS transaction`/`use
  the connected POS now` -> `opskeep-tools`/`composio-mcp`.

## Help

Sparse context or explicit `help`/`menu`:

```md
Opskeep Hospitality helps run the venue.

Run the venue:
- `stock up` - ingredient ordering, par levels, delivery reconciliation.
- `plan service` - menu, prep list, shift rota.
- `serve` - reservation/table status, kitchen ticket execution.
- `get paid` - nightly close-out, tips, delivery-platform fees, supplier bills, margin.
- `keep customers` - review requests, complaint recovery, regulars/loyalty.
- `improve operations` - food cost, waste, labor percent, inspection readiness.

Manage Opskeep Hospitality:
- `setup`, `connect tools`, `venue profile`, `supplier profile`, `staff roster`

Opskeep Tools (shared with core Opskeep):
- `audio brief`, `voice session`, `follow-up reminder`, `time tracking`, `expense tracking`, `composio`

Decision stub: next action, owner, date, evidence. Use `TBD` when missing.
```

## References

- Lane workflows: load the standalone lane skill. The lane skill owns its references and
  examples.
- Connectors: use `opskeep-hospitality-manage` for connection setup/status and
  `opskeep-tools`/`composio-mcp` for live app reads/writes.

## Gotchas

- Do not route generic coding, writing, or research into Opskeep Hospitality.
- Do not edit/copy internals of `opskeep-tools` or its breakout skills; those are shared,
  unforked, and owned by the core Opskeep pack.
- Do not weaken confirmation gates for connector writes, refunds, reminders, or customer
  outreach sends.
- Do not invent stock levels, covers, food cost percentages, labor hours, or compliance
  status. Use `TBD` for unknowns.
- Do not resolve a food-safety or labor-compliance question yourself (tip-pooling
  legality, overtime rules, inspection pass/fail). Surface it and say it needs a qualified
  professional or the venue's own policy.
- One venue and one continuous service is assumed by default. If daypart (breakfast/
  lunch/dinner) or multi-location context is present, ask which one before acting.
