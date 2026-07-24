# Opskeep Retail Get Paid Reference

Use to produce a reconciled figure, a flagged discrepancy, or a payment follow-through
action — not a general "sales were fine" summary.

## Starter Jobs

- Reconcile till totals for a day/period against expected sales.
- Process or track a refund/exchange.
- Track a supplier bill toward payment.
- Read margin at the SKU, product line, or shop level.

## Required Inputs

- Till total and expected sales for the period, or `TBD`.
- Refund/exchange request details (order reference, amount, reason).
- Supplier bill details (amount, due date, supplier), or `TBD`.
- Cost basis and target margin (from `opskeep-retail-plan-drop`) for margin reads.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live POS/payment-processor totals and supplier
  invoice data when connected. Verify connection before stating a figure as current.
- `opskeep-retail-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: reconciliation, refund/exchange, bill payment, or margin read.
2. Gather the relevant figures. Mark anything not connected or stated as `TBD`.
3. For reconciliation: compare till total to expected sales; if they don't match, name
   the discrepancy amount and the most likely cause (unrecorded refund, till error, theft)
   without asserting a cause you can't evidence.
4. For refund/exchange: confirm order reference and amount before treating it as
   approved.
5. For margin: compute actual margin from cost basis and sale price; compare to the
   target set in `opskeep-retail-plan-drop`; flag if it's off-target.
6. Hold any money-moving action (refund, bill payment) for explicit confirmation.

## Output Shape

- `Item`: reconciliation, refund, bill, or margin figure.
- `Amount`: with currency/account/SKU as relevant, or `TBD`.
- `Status`: reconciled, discrepancy, pending, paid.
- `Discrepancy/risk`: named cause if evidenced, otherwise `TBD`.
- `Next action`: owner and due/review date.

## Rules

- Never state a till total, refund status, or bill status without a connected source or
  the user's own statement.
- Do not process a refund or bill payment without explicit confirmation of amount and
  recipient.
- A margin figure without a stated cost basis is incomplete — mark it `TBD`, don't
  estimate silently.
