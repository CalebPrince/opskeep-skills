---
name: opskeep-retail
description: "Use when the user invokes Opskeep Retail and needs routing across shop operations: stock up, plan the drop, sell, get paid, keep customers, improve operations; or Opskeep Retail Manage for shop setup, connectors, and preferences. Routes to opskeep-tools for standalone hosted utilities shared with the core Opskeep pack."
metadata:
  lane: meta
  version: 0.1.0
---

# Opskeep Retail

Opskeep Retail routes the work around running a shop: stock, sell, get paid, keep
customers, and get better at all of it next cycle. See
[`DESIGN.md`](../../DESIGN.md) for the lane model this router implements.

Choose one primary destination, hand off to that skill or reference, return sources,
owners, next actions, and `TBD` for unknowns.

## Workflow

1. **Classify the request.** Decide whether this is shop work, managing Opskeep Retail, a
   shared Opskeep tool, explicit help/menu, or not an Opskeep Retail task.
2. **Pick one primary destination.** Use the command matrix, routing rules, and
   tie-breakers below. If no command is present, route by conversation context when safe.
3. **Load the destination.** Prefer the standalone skill named in the matrix.
4. **Check route-specific gotchas.** Use this router's gotchas plus the destination
   skill's rules before output with connector-access risk or customer-facing consequences.
5. **Use connectors only when needed.** For POS/inventory/supplier connector setup or
   status, route to `opskeep-retail-manage`. For live reads/writes, route to
   `opskeep-tools`/`composio-mcp` with discovery and schema checks.
6. **Run the workflow.** Preserve required inputs, approval gates, provenance, and output
   contract. Use `TBD` for missing facts.
7. **Return the smallest useful next step.** Include secondary follow-ups only when
   useful, unless the user asks for a chain.

No command? Use conversation context to choose the best destination. Show the menu only
for explicit `help`/`menu`, sparse context, or unsafe routing. Not shop ops, Opskeep
Retail setup/config, or a shared Opskeep utility? Do not force Opskeep Retail.

## Command Matrix

| Group | Commands and aliases | Primary route |
|---|---|---|
| Stock up | `stock up`, `reorder`, `restock`, `purchase order`, `supplier order`, `SKU intake`, `low stock` | `opskeep-retail-stock-up` |
| Plan the drop | `plan the drop`, `pricing`, `merchandising`, `markdown`, `launch calendar`, `seasonal drop` | `opskeep-retail-plan-drop` |
| Sell | `sell`, `sale`, `transaction`, `fulfillment`, `order status`, `oversell`, `backorder` | `opskeep-retail-sell` |
| Get paid | `get paid`, `till`, `reconciliation`, `refund`, `exchange`, `supplier bill`, `margin` | `opskeep-retail-get-paid` |
| Keep customers | `keep customers`, `loyalty`, `review request`, `win-back`, `restock alert`, `repeat customer` | `opskeep-retail-keep-customers` |
| Improve operations | `improve operations`, `sell-through`, `shrinkage`, `reorder point`, `markdown review` | `opskeep-retail-improve-operations` |
| Manage Opskeep Retail | `manage`, `setup`, `shop profile`, `supplier profile`, `staff roster`, `connect tools`, `connector`, `POS setup`, `autonomy`, `autonomous mode` | `opskeep-retail-manage` |
| Opskeep Tools (shared) | `audio brief`, `voice session`, `follow-up reminder`, `time tracking`, `expense tracking`, `escalate`, `escalation`, `composio`, `hosted utility` | `opskeep-tools` |
| Help | `help`, `menu`, sparse context, unsafe/unknown route | show command menu inline (see Help below) |

## Routing Rules

1. Known command/alias after Opskeep Retail -> matching route.
2. Exact `help` or `menu` -> show command menu.
3. No command, missing command, or unknown command with clear context -> route by intent
   instead of showing menu.
4. `opskeep-retail-manage` owns shop setup, product/supplier profile, staff roster,
   connected tools, and preferences.
5. `opskeep-tools` owns standalone hosted utilities shared with the core Opskeep pack:
   audio briefs, voice huddles, follow-up reminders, time tracking, expense tracking, and
   Composio-backed tool access. Reused as-is; this pack does not fork it.
6. Live POS/inventory/supplier reads or writes go through `opskeep-tools`/`composio-mcp`
   discovery and schema rules. Never guess connector slugs.
7. Multiple matches -> one primary destination plus secondary follow-ups, unless the user
   asks for a chain.
8. Sparse or unsafe route -> help/menu plus one clarifying question only if needed.
9. Default every lane to `approval_required`. A shop-facing request to complete sales
   autonomously routes to `opskeep-retail-manage` to turn it on explicitly; do not treat
   autonomy as already on without confirming it in setup.

## Tie-Breakers

- `refund`/`exchange` -> `get paid` (money reversal), not `sell` or `keep customers`.
- `markdown` -> `plan the drop` for setting the new price; `improve operations` for
  reviewing whether past markdowns worked.
- `restock alert` (outbound to a customer, "this is back in stock") -> `keep customers`.
  `restock`/`reorder` (inbound from a supplier) -> `stock up`.
- `pricing` -> `plan the drop`, not `get paid`, unless the ask is specifically about
  margin on money already collected.
- `POS setup`/`connector status` -> `opskeep-retail-manage`. `POS transaction`/`use the
  connected POS now` -> `opskeep-tools`/`composio-mcp`.

## Help

Sparse context or explicit `help`/`menu`:

```md
Opskeep Retail helps run the shop.

Run the shop:
- `stock up` - reorder drafts, supplier ordering, low-stock flags.
- `plan the drop` - pricing, merchandising calendar, markdown timing.
- `sell` - transaction/fulfillment status, exceptions.
- `get paid` - till reconciliation, refunds, supplier bills, margin.
- `keep customers` - loyalty, reviews, win-back, restock alerts.
- `improve operations` - sell-through, shrinkage, reorder-point tuning.

Manage Opskeep Retail:
- `setup`, `connect tools`, `shop profile`, `supplier profile`, `staff roster`

Opskeep Tools (shared with core Opskeep):
- `audio brief`, `voice session`, `follow-up reminder`, `time tracking`, `expense tracking`, `escalate to owner`, `composio`

Decision stub: next action, owner, date, evidence. Use `TBD` when missing.
```

## References

- Lane workflows: load the standalone lane skill. The lane skill owns its references and
  examples.
- Connectors: use `opskeep-retail-manage` for connection setup/status and
  `opskeep-tools`/`composio-mcp` for live app reads/writes.

## Gotchas

- Do not route generic coding, writing, or research into Opskeep Retail.
- Do not edit/copy internals of `opskeep-tools` or its breakout skills; those are shared,
  unforked, and owned by the core Opskeep pack.
- Do not weaken confirmation gates for connector writes, refunds, reminders, or customer
  outreach sends.
- Do not invent stock levels, sell-through figures, supplier lead times, or margin
  numbers. Use `TBD` for unknowns.
- One shop location is assumed by default. If multi-location context is present, ask
  which location before acting.
- Autonomous sale completion is opt-in per shop, set in `opskeep-retail-manage`. Never
  assume it's on; a lane skill with an unknown autonomy setting defaults to holding for
  approval.
