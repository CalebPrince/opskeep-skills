# Opskeep Retail Autonomous Sale Reference

Use only when the shop has turned on `autonomous_with_escalation` for this lane (set in
`opskeep-retail-manage`, see `references/transaction-autonomy.md`). If that setting is
`TBD` or unknown, treat it as off and use the default hold-for-approval workflow in
`references/sell.md` instead.

## What Autonomous Mode Actually Authorizes

Completing one routine, already-in-policy sale end-to-end:

1. Quote a price for an in-stock item, using pricing already approved in
   `opskeep-retail-plan-drop` — never a price the agent is inventing or guessing at.
2. Confirm quantity and availability against real stock (via `composio-mcp`, not assumed).
3. Send a payment link for the quoted amount.
4. Confirm the order (pickup/delivery slot) once payment is initiated.

It does not authorize: discounts or terms outside what's already set, refunds/exchanges,
purchase decisions, or anything the shop hasn't explicitly scoped autonomy to cover.

## Escalation Triggers

Check every message against the trigger list in `opskeep-retail-manage`'s
`references/transaction-autonomy.md` (price/terms deviation, ambiguous request, dispute,
above value threshold, low confidence). On a match, stop and route to
`opskeep-escalate-to-owner` — do not send a guessed response first and escalate after.

## Workflow

1. Confirm autonomous mode is actually on for this lane before doing anything without a
   hold. If unconfirmed, fall back to the default approval-required workflow.
2. Read the customer's request. If it matches a routine, in-stock, already-priced item
   with no escalation trigger, proceed through the four steps above without holding for
   approval.
3. At each step, check for a new trigger (e.g. the customer asks for a discount mid-flow).
   If one appears, stop immediately and escalate; don't finish the step in progress first
   unless finishing it is clearly safe (e.g. confirming a price you already quoted is
   fine; sending a discount you haven't cleared is not).
4. Log what happened plainly: quoted, paid, confirmed, or escalated and why.

## Output Contract

- Item, quantity, price quoted (and its source: the approved price list).
- Payment link sent, and confirmation once payment is initiated.
- Order confirmation (pickup/delivery) once complete.
- Escalation reference instead of the above, if triggered.

## Rules

- Never quote a price the agent invented. If plan-drop pricing isn't available for the
  item, that's an escalation trigger (ambiguous/out of authorization), not a guess.
- Never treat "autonomous mode is probably on" as sufficient. Confirm it.
- A completed autonomous sale still needs to be visible to the owner afterward (a normal
  status/summary), even though it didn't need their approval in the moment. This isn't
  optional just because nothing was held.
