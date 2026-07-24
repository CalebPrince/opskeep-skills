# Opskeep Retail Connectors

Use for Opskeep Retail connected-tool setup, status, explanation, or troubleshooting.

## Mental Model

- Not a lane.
- `opskeep-retail-manage` owns setup/status/config.
- `opskeep-tools` owns one-off live app actions.
- Lane skills own intent and request tool access when needed.
- `composio-mcp` owns discovery, auth, schemas, and execution.

This pack does not hardcode a specific POS or inventory platform. Discover the shop's
actual toolkit through `composio-mcp` rather than assuming Shopify, Square, Lightspeed, or
any other named platform is in use — those are examples of what a shop might connect, not
a fixed integration list.

## Connector Categories

- Point of sale: in-store transaction platforms.
- Inventory/supplier ordering: stock levels, purchase orders, supplier catalogs.
- E-commerce: online storefront, order sync between channels.
- Loyalty and marketing: customer contact, loyalty program, review platforms.
- Money and records: payment processing, accounting/bookkeeping tools.

## Lane Map

| Opskeep Retail lane | Common connector categories |
|---|---|
| Stock up | Inventory/supplier ordering, point of sale (for sell-through data) |
| Plan the drop | Point of sale (historical sales), e-commerce |
| Sell | Point of sale, e-commerce |
| Get paid | Money and records, point of sale, inventory/supplier ordering (bills) |
| Keep customers | Loyalty and marketing, point of sale (purchase history) |
| Improve operations | Point of sale, inventory/supplier ordering, money and records |

## Add A Connector

Use when Opskeep Retail needs a new app or missing account connection.

1. Name the job it should support.
2. Map the job to a connector category and target app.
3. Pick minimum permission: read, write, publish, notify, or manage.
4. Use `composio-mcp` discovery to find the toolkit and connection status.
5. If disconnected, give the MCP-provided authorization link.
6. After authorization, run the smallest safe read-only check.
7. Summarize what connected, what Opskeep Retail can do, and remaining gaps.

## Setup Workflow

1. Confirm job/capability.
2. Identify app + permission category.
3. Route through `composio-mcp` discovery.
4. Check active connection.
5. If disconnected, provide auth link and wait.
6. After auth, run smallest safe read-only check.
7. Return connected app, new capability, remaining gaps.

## Output Contract

- Connector objective.
- Target app/toolkit.
- Needed permission category.
- Current connection status: `connected`, `needs-auth`, `blocked`, or `TBD`.
- Setup action or authorization step.
- Safety note for writes/refunds/customer-facing sends.
- Provenance for any live check.

## Rules

- Never claim active status without tool-returned status or verified runtime evidence.
- Do not ask users for raw secrets in chat.
- Do not test connections with writes, refunds, customer sends, or supplier orders.
- If the shop connects a tool for a lane, keep the lane objective visible and route only
  setup here.
- If the user uses an already-connected app now, route to `opskeep-tools`/`composio-mcp`
  or the lane + Composio execution.
- Lane skills name common categories; this file owns setup/status.
