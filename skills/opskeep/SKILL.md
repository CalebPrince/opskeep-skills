---
name: opskeep
description: Routes business work, Opskeep setup, and Opskeep hosted tools into the right skill with clear next actions, owners, dates, and unknowns. Use for any request that touches the operational side of running a service business, or when it's unclear which lane a request belongs to.
lane: meta
---

# Opskeep: core router

Opskeep is the entry point. Most users won't know (or care) which lane skill handles their
request; they'll just say "invoice Client X" or "draft an update for the Meridian
project." This skill's job is to read the request, route it, and hand off enough context
that the target skill doesn't have to re-ask the basics.

## When to trigger

- The request is about running the business side of service work (not the craft itself):
  pipeline, scoping, delivery status, invoicing, client relationships, retros.
- The request mentions Opskeep by name, or asks "what can Opskeep do."
- The request is ambiguous between two lanes: route here first, then hand off.

## Routing table

| Signal in the request | Route to |
| --- | --- |
| Leads, inbound, referrals, "who should I follow up with to sell" | `opskeep-win-work` |
| Discovery calls, proposals, scope docs, new client onboarding | `opskeep-scope-work` |
| Status updates, blockers, handoffs, "where are we on X" | `opskeep-run-work` |
| Invoices, payments, billable time, budget/margin | `opskeep-get-paid` |
| Check-ins, renewals, referrals, client health | `opskeep-keep-clients` |
| Retros, lessons learned, SOPs, closeout | `opskeep-sharpen-craft` |
| Opskeep setup, memory, connectors, automations | `opskeep-manage` |
| Session recaps, reminders, time tracking as a standalone ask | `opskeep-tools` |

## Before handing off

Gather (or infer from context already in the session):

1. **Which client/project** the request is about, if any.
2. **What's already known**: don't make the target skill re-derive facts visible in the
   current session.
3. **What "done" looks like**: an update sent, an invoice line added, a reminder
   scheduled, etc.

If the lane is genuinely ambiguous after reading the request, ask one clarifying question
rather than guessing.

## What this skill does not do

It does not produce the final artifact itself. It routes and hands off context. If a
request clearly spans two lanes (e.g., a scope change that also needs a new invoice line),
route to the primary lane first and note the secondary handoff explicitly.
