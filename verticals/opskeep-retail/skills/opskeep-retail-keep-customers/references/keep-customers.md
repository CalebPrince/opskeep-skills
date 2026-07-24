# Opskeep Retail Keep Customers Reference

Use to produce a concrete outreach draft or a customer-health signal, not a generic
"engage your customers more" observation.

## Starter Jobs

- Draft loyalty outreach or a repeat-visit nudge.
- Draft a review/testimonial request tied to a specific purchase.
- Draft a restock-alert send to customers who wanted an item now back in stock.
- Build a win-back list for lapsed customers.

## Required Inputs

- Customer or segment identity, or `TBD` if not connected/known.
- The specific signal driving this touch (purchase, loyalty milestone, restock, lapse
  window).
- Lapse window definition, for win-back lists.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live purchase history, loyalty status, and
  customer contact info when connected. Verify connection before treating data as
  current.
- `opskeep-tools` -> `opskeep-follow-up-reminders`: only for a one-shot self-email
  reminder, not customer-facing sends.
- `opskeep-retail-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: loyalty outreach, review request, restock alert, or win-back
   list.
2. Identify the customer/segment and the specific signal driving this touch. Mark
   missing context `TBD`.
3. Draft the message or list. Ground tone and content in the actual signal (what they
   bought, what they're waiting for), not generic templated copy.
4. Hold for explicit confirmation before treating any send as approved.

## Output Shape

- `Customer/segment`: who this is for.
- `Signal`: why now.
- `Suggested touch`: draft message or list contents.
- `Owner/timing`: who sends it and when.
- `Status`: draft, pending confirmation.

## Rules

- Never invent a customer's purchase history or loyalty tier.
- A win-back list needs an explicit lapse-window definition attached to it.
- Do not treat a drafted message as sent until the user confirms.
