# Opskeep Hospitality Keep Customers Reference

Use to produce a concrete outreach draft or a guest-health signal, not a generic "improve
guest satisfaction" observation.

## Starter Jobs

- Draft a review/testimonial request tied to a specific visit.
- Draft complaint recovery follow-up.
- Track a regular's visit pattern and preferences.

## Required Inputs

- Guest or segment identity, or `TBD` if not connected/known.
- The specific signal driving this touch (positive visit, complaint, visit-pattern
  milestone).
- Complaint detail, for recovery follow-up.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live reservation history and guest notes when
  connected. Verify connection before treating data as current.
- `opskeep-tools` -> `opskeep-follow-up-reminders`: only for a one-shot self-email
  reminder, not guest-facing sends.
- `opskeep-hospitality-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: review request, complaint recovery, or regulars tracking.
2. Identify the guest/segment and the specific signal driving this touch. Mark missing
   context `TBD`.
3. Draft the message. Ground tone and content in the actual signal (what they ordered,
   what went wrong, how often they visit), not generic templated copy.
4. For complaint recovery, name the specific issue and what's being offered, if
   anything, rather than a generic apology.
5. Hold for explicit confirmation before treating any send as approved.

## Output Shape

- `Guest/segment`: who this is for.
- `Signal`: why now.
- `Suggested touch`: draft message.
- `Owner/timing`: who sends it and when.
- `Status`: draft, pending confirmation.

## Rules

- Never invent a guest's visit history or complaint detail.
- Complaint recovery needs the actual issue named, not a placeholder apology.
- Do not treat a drafted message as sent until the user confirms.
