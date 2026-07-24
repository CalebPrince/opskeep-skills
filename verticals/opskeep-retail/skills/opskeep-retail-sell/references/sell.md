# Opskeep Retail Sell Reference

Use to produce a transaction/fulfillment status or a flagged exception, not a sales-volume
narrative — that belongs to `opskeep-retail-improve-operations`.

## Starter Jobs

- Check the status of a specific transaction or order.
- Sync an online order to in-store fulfillment (or vice versa).
- Flag an oversell, backorder, or channel mismatch and propose the next action.

## Required Inputs

- Order/transaction reference, or enough context to find it (customer, SKU, approximate
  time).
- Channel (in-store, online, marketplace).
- Current fulfillment state, or `TBD` if not connected/known.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live POS/e-commerce order status when connected.
  Verify connection before stating a status as current.
- `opskeep-retail-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: status check, fulfillment sync, or exception flag.
2. Identify the order/transaction and channel. Ask if genuinely ambiguous.
3. Pull current status if a connected source is available; otherwise mark `TBD` and say
   what's needed to confirm it.
4. If an exception exists (oversold SKU, backordered item, channel mismatch), name it
   explicitly, its likely cause, and the smallest next action (partial fulfillment,
   customer notification, expedited reorder via `opskeep-retail-stock-up`).
5. Return status plus next action; do not let an exception pass silently into a "fulfilled"
   summary.

## Output Shape

- `Order/transaction`: reference or description.
- `Channel`: in-store, online, marketplace.
- `Status`: fulfilled, pending, exception.
- `Exception`: type and cause, if any.
- `Next action`: owner and what happens next.

## Rules

- Never state a transaction is fulfilled without evidence from a connected source or the
  user's own statement.
- Oversell/backorder is always surfaced, never smoothed into "mostly fine."
- Route pricing questions to `opskeep-retail-plan-drop` and refund/reconciliation
  questions to `opskeep-retail-get-paid` rather than answering them here.
