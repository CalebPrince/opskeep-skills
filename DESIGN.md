# Design principles

## The six lanes

Opskeep models a service business as a loop, not a funnel. Work moves through six lanes,
and the loop feeds itself: what you learn in "improve operations" changes how the next
cycle plays out in "get work."

1. **Get work**: pipeline, leads, qualification
2. **Define work**: discovery, proposals, onboarding
3. **Deliver work**: delivery, coordination, status
4. **Get paid**: invoicing, time, budgets
5. **Keep clients**: relationships, renewals, referrals
6. **Improve operations**: retros, lessons, process

Each lane is owned by exactly one skill. A lane skill may read context from another lane
(e.g., `opskeep-get-paid` reading the scope from `opskeep-define-work`) but should never
duplicate another lane's workflow.

## Two meta surfaces

- **`opskeep-manage`**: setup, preferences, memory, connectors, automations. This is
  "operating Opskeep," not "operating the business."
- **`opskeep-tools`**: routes standalone breakout skills (audio briefs, voice huddles,
  follow-up reminders, time tracking, Composio-backed tool access) that are useful even
  outside a lane workflow.

## Routing philosophy

The core `opskeep` skill is a thin router. It should:

- Recognize which lane (or meta surface) a request belongs to
- Hand off with enough context that the target skill doesn't need to re-ask
- Default to asking a clarifying question over guessing when the lane is ambiguous

## Output philosophy

Every skill should end its work with something concrete: a next action, an owner, a date,
or an artifact (update, invoice line, reminder). "Here's some advice" is not a satisfying
output on its own; "here's the update, and it's ready to send" is.
