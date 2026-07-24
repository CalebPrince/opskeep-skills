---
name: opskeep-manage
description: Onboards and manages Opskeep itself — business profile, preferences, memory, connectors, automations, and triggers. Use for setup and configuration requests, not for day-to-day business-lane work.
lane: meta
---

# Manage Opskeep

Covers operating Opskeep, as distinct from operating the business. Setup, preferences,
memory, and the automations that run on top of the lane skills.

## When to trigger

- First-time setup: "help me set up Opskeep."
- "Remember that I always net-15 new clients."
- "Connect my Slack / GitHub / Gmail."
- "Set up a weekly automation that posts my status update to Slack."

## What to gather

- Business profile basics: what the business does, typical engagement shape, standard
  rates or terms — only what's needed to make lane skills more accurate, not exhaustive.
- Existing preferences already recorded, so setup doesn't repeat questions.
- For connectors: which tool, and what specifically needs to be read or written (avoid
  requesting broader access than the automation needs).

## What to produce

- A saved preference or profile fact, applied consistently by other skills going forward.
- A connector authorization flow, scoped to what was asked for.
- An automation/trigger definition: what fires it, what it does, and confirmation before
  it goes live — automations are never created silently.

## Handoffs

- Once setup is done, route the actual business request to the relevant lane skill via
  `opskeep`.

## Guardrails

- Always confirm before creating a recurring automation or trigger — describe exactly what
  will run and when, and wait for explicit go-ahead.
- Don't request tool access broader than the stated use case.
