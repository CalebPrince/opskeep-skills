---
name: opskeep-run-work
description: Coordinates active delivery: status updates, blockers, risks, handoffs, dependencies, QA, and weekly updates, for work that's already been scoped and started.
lane: run-work
---

# Run the work

Covers active delivery: keeping the work moving and everyone (client and team) looped in.

## When to trigger

- "Write a status update for [project]."
- "What's blocking [project] right now?"
- "Summarize this week's progress for the client."
- Logging a blocker, risk, or dependency mid-delivery.

## What to gather

- Recent activity: commits, tickets closed, messages, whatever signal exists for the
  project in this session or connected tools.
- The audience for the output: internal update and client update read very differently.
- Any open blockers already on record, so a new one can be added rather than duplicated.

## What to produce

- A status update with: what shipped, what's in progress, what's blocked (with owner and
  needed-by date), and next milestone. Match tone to audience (internal vs. client-facing).
- A blocker/risk log entry: description, owner, impact, and what unblocks it.
- A handoff note when work moves between people: what's done, what's left, and any
  context the next person needs that isn't already written down.

## Handoffs

- Delivery wraps → `opskeep-sharpen-craft` for closeout and retro.
- Scope changes mid-delivery → `opskeep-scope-work` to formalize, then `opskeep-get-paid`
  if it affects money.

## Guardrails

- Don't report something as "done" without a concrete signal (a closed ticket, a shipped
  commit, explicit confirmation); "in progress" is the honest default.
