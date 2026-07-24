# Opskeep Hospitality Get Paid Reference

Use to produce a reconciled figure, a flagged discrepancy, or a payment follow-through
action — not a general "service went fine tonight" summary.

## Starter Jobs

- Reconcile nightly/period close-out against expected sales.
- Compute a tips split using the venue's stated policy.
- Reconcile delivery-platform payouts against order volume and platform fees.
- Track a supplier bill toward payment.
- Read margin at the dish, category, or venue level.

## Required Inputs

- Close-out total and expected sales for the period, or `TBD`.
- Tips pool total and the venue's stated split policy (by hours, by role, equal share).
- Delivery-platform payout and order volume for the period, or `TBD`.
- Supplier bill details (amount, due date, supplier), or `TBD`.
- Food cost basis and target percentage (from `opskeep-hospitality-plan-service`) for
  margin reads.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live POS/payment-processor and delivery-platform
  totals when connected. Verify connection before stating a figure as current.
- `opskeep-hospitality-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: close-out, tips split, delivery-fee reconciliation, bill payment,
   or margin read.
2. Gather the relevant figures. Mark anything not connected or stated as `TBD`.
3. For close-out: compare total to expected sales; if they don't match, name the
   discrepancy amount and the most likely cause without asserting a cause you can't
   evidence.
4. For tips: apply the venue's stated split policy exactly as given. If no policy is
   stated, ask for it rather than assuming an even split. Do not comment on whether the
   policy is legally compliant — that's a qualified-professional question.
5. For delivery platforms: compare payout to order volume at the platform's stated fee
   rate; flag anything that doesn't reconcile.
6. For margin: compute actual margin from food cost basis and menu price; compare to the
   target set in `opskeep-hospitality-plan-service`; flag if it's off-target.
7. Hold any money-moving action (refund, bill payment) for explicit confirmation.

## Output Shape

- `Item`: close-out, tips split, delivery reconciliation, bill, or margin figure.
- `Amount`: with currency/account/dish as relevant, or `TBD`.
- `Status`: reconciled, discrepancy, pending, paid.
- `Discrepancy/risk`: named cause if evidenced, otherwise `TBD`.
- `Next action`: owner and due/review date.

## Rules

- Never state a close-out total, tips split, or bill status without a connected source or
  the user's own statement.
- Never invent or validate a tip-pooling/overtime policy's legality; apply the stated
  policy and flag compliance questions elsewhere.
- Do not process a refund or bill payment without explicit confirmation of amount and
  recipient.
- A margin figure without a stated food cost basis is incomplete — mark it `TBD`, don't
  estimate silently.
