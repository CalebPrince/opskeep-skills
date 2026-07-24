# Product surfaces

Opskeep ships in three tiers. This document tracks what's in each so skill and doc
changes stay consistent with what's actually offered.

## Open Source ($0)

- All six business-lane skills + the core router
- Install via CLI (`npx skills add`) or `git clone`
- Pick individual skills instead of the whole pack
- MIT licensed, runs entirely inside the user's own agent

## Pro ($29/month)

Everything in Open Source, plus hosted tools that require server-side infrastructure:

- Client updates and follow-up reminders sent by Opskeep's hosted service
- Session recaps (audio) generated server-side
- Time tracking synced across sessions
- Managed connectors: Slack, GitHub, Gmail, Stripe, Notion, Linear, Google Drive, Figma

## Managed (custom)

Everything in Pro, plus:

- Opskeep staff configure and tune the agent for a specific workflow
- Always-on / scheduled operation, not just session-triggered
- Priority support and onboarding

## What lives where

| Capability | Open Source | Pro | Managed |
| --- | --- | --- | --- |
| Business-lane skills | ✅ | ✅ | ✅ |
| Core router | ✅ | ✅ | ✅ |
| Hosted client updates | n/a | ✅ | ✅ |
| Hosted reminders | n/a | ✅ | ✅ |
| Session recaps | n/a | ✅ | ✅ |
| Time tracking sync | n/a | ✅ | ✅ |
| Managed connectors | n/a | ✅ | ✅ |
| Always-on operation | n/a | n/a | ✅ |
| Custom tuning & support | n/a | n/a | ✅ |
