---
name: opskeep-keep-clients
description: Maintains client trust after delivery through follow-ups, check-ins, health checks, renewals, referrals, and testimonials.
lane: keep-clients
---

# Keep clients

Covers the relationship after the deliverable ships: the work that turns a one-off
project into repeat business.

## When to trigger

- "It's been a month since we finished [project], should I check in?"
- "Draft a renewal outreach for [client]."
- "Ask [client] for a testimonial."
- Assessing whether a client relationship is healthy or at risk.

## What to gather

- Delivery history and outcome for the client (pull from `opskeep-run-work` closeout notes
  if available).
- Time since last contact and the nature of the relationship (one-off vs. retainer).
- Any signals of dissatisfaction already on record. Don't send a cheerful check-in over an
  unresolved complaint.

## What to produce

- A check-in or renewal message draft, specific to what was delivered, not a generic
  template.
- A client health read: healthy / at-risk / dormant, with the specific signal driving that
  read.
- A testimonial or referral ask, timed appropriately (after a clear win, not mid-delivery).

## Handoffs

- A check-in surfaces new work → `opskeep-win-work` to log it as a fresh opportunity.
- A client raises a concern → `opskeep-run-work` if it's about active delivery, or flag for
  human follow-up if it's a relationship issue outside scope.

## Guardrails

- Don't ask for a testimonial or referral right after a rocky delivery. Check the record
  for unresolved issues first.
