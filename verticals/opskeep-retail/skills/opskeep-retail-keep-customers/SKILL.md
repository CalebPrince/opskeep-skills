---
name: opskeep-retail-keep-customers
description: "Use when the user wants Opskeep Retail to maintain customer trust and repeat business: loyalty outreach, review requests, restock-alert sends, win-back lists, and repeat-visit nudges."
metadata:
  lane: keep-customers
  version: 0.1.0
---

# Opskeep Retail Keep Customers

Turn a sale into a returning customer.

## Use For

- Loyalty program outreach and repeat-visit nudges.
- Review/testimonial requests after a purchase.
- Restock-alert outreach when an item a customer wanted is back in stock.
- Win-back lists for lapsed customers.

## References

- Load `references/keep-customers.md` for the lane workflow.

## Output Contract

- Customer or segment.
- Why now (purchase signal, loyalty milestone, restock, lapse).
- Suggested touch or ask.
- Owner and timing.
- Source/evidence or `TBD`.
- Watchlist items (customers trending toward lapse).

## Boundaries

- Do not send outreach or schedule reminders unless explicitly asked.
- One-shot self-email reminders go through `opskeep-tools` to `opskeep-follow-up-reminders`.
- Live customer/purchase-history reads go through `opskeep-tools`/`composio-mcp`.
- Loyalty/CRM connector setup goes to `opskeep-retail-manage`.

## Gotchas

- Do not fake purchase history or loyalty status; mark unknown context as `TBD`.
- A review/testimonial ask should follow an evidenced positive signal (completed
  purchase, positive interaction), not be sent speculatively.
- A win-back list needs a defined lapse window (e.g., no purchase in 90 days) stated
  explicitly, not assumed.
