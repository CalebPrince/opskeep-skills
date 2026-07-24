---
name: opskeep-hospitality-keep-customers
description: "Use when the user wants Opskeep Hospitality to maintain guest trust and repeat visits: review requests, complaint recovery, and regulars/loyalty tracking."
metadata:
  lane: keep-customers
  version: 0.1.0
---

# Opskeep Hospitality Keep Customers

Turn a visit into a returning guest.

## Use For

- Review/testimonial requests after a positive visit.
- Complaint recovery follow-up.
- Regulars and loyalty tracking (repeat visit patterns, preferences).

## References

- Load `references/keep-customers.md` for the lane workflow.

## Output Contract

- Guest or segment.
- Why now (positive visit signal, complaint, regular's pattern).
- Suggested touch or ask.
- Owner and timing.
- Source/evidence or `TBD`.
- Watchlist items (guests trending toward a bad experience or lapse).

## Boundaries

- Do not send outreach or schedule reminders unless explicitly asked.
- One-shot self-email reminders go through `opskeep-tools` to `opskeep-follow-up-reminders`.
- Live reservation/guest-history reads go through `opskeep-tools`/`composio-mcp`.
- Loyalty/CRM connector setup goes to `opskeep-hospitality-manage`.
- An active, in-the-moment service issue is `opskeep-hospitality-serve`'s job to resolve;
  this skill handles the follow-up recovery after the visit.

## Gotchas

- Do not fake visit history or loyalty status; mark unknown context as `TBD`.
- A review/testimonial ask should follow an evidenced positive signal, not be sent
  speculatively after every visit.
- Complaint recovery needs the actual complaint detail, not a generic apology; ask if it
  isn't in context.
