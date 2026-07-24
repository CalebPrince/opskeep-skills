# Opskeep Hospitality Connectors

Use for Opskeep Hospitality connected-tool setup, status, explanation, or troubleshooting.

## Mental Model

- Not a lane.
- `opskeep-hospitality-manage` owns setup/status/config.
- `opskeep-tools` owns one-off live app actions.
- Lane skills own intent and request tool access when needed.
- `composio-mcp` owns discovery, auth, schemas, and execution.

This pack does not hardcode a specific POS, reservation, or delivery platform. Discover
the venue's actual toolkit through `composio-mcp` rather than assuming Toast, Square,
OpenTable, Resy, Uber Eats, DoorDash, or any other named platform is in use — those are
examples of what a venue might connect, not a fixed integration list.

## Connector Categories

- Point of sale: in-venue transaction and kitchen-ticket platforms.
- Reservations/waitlist: table booking and waitlist management.
- Delivery platforms: third-party order and payout systems.
- Supplier ordering: ingredient purchasing and invoicing.
- Money and records: payment processing, payroll, accounting/bookkeeping tools.
- Loyalty and marketing: guest contact (including WhatsApp), loyalty program, review platforms.

## Lane Map

| Opskeep Hospitality lane | Common connector categories |
|---|---|
| Stock up | Supplier ordering, point of sale (for covers/velocity data) |
| Plan service | Point of sale (historical covers), payroll (staff availability) |
| Serve | Point of sale, reservations/waitlist |
| Get paid | Money and records, point of sale, delivery platforms, supplier ordering (bills) |
| Keep customers | Loyalty and marketing, reservations/waitlist (visit history) |
| Improve operations | Point of sale, payroll, supplier ordering, money and records |

## Add A Connector

Use when Opskeep Hospitality needs a new app or missing account connection.

1. Name the job it should support.
2. Map the job to a connector category and target app.
3. Pick minimum permission: read, write, publish, notify, or manage.
4. Use `composio-mcp` discovery to find the toolkit and connection status.
5. If disconnected, give the MCP-provided authorization link.
6. After authorization, run the smallest safe read-only check.
7. Summarize what connected, what Opskeep Hospitality can do, and remaining gaps.

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
- Safety note for writes/refunds/guest-facing sends.
- Provenance for any live check.

## Rules

- Never claim active status without tool-returned status or verified runtime evidence.
- Do not ask users for raw secrets in chat.
- Do not test connections with writes, refunds, guest sends, or supplier orders.
- If the venue connects a tool for a lane, keep the lane objective visible and route only
  setup here.
- If the user uses an already-connected app now, route to `opskeep-tools`/`composio-mcp`
  or the lane + Composio execution.
- Lane skills name common categories; this file owns setup/status.
