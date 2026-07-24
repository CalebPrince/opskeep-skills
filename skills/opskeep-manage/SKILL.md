---
name: opskeep-manage
description: "Use when the user wants to operate Opskeep itself: onboard Opskeep into their business, update business profile/preferences, manage company brain or memory, connect tools, configure automations/triggers/loops, or audit what Opskeep knows and can access."
lane: meta
metadata:
  version: 0.1.0
---

# Opskeep Manage

Set up and maintain Opskeep as an operations agent.

## Use For

- Onboarding Opskeep into a business: services, clients, tools, workflows, cadence, preferences, and first job.
- Business profile, company brain, memory, permissions, and access review.
- Connected tool setup, connector status, and Composio connection readiness.
- Automations, triggers, loops, scheduled workflows, and recurring work setup.

## References

- Load `references/connectors.md` for connected-tool setup, connector status, and Composio connection readiness.

## Output Contract

- Configuration objective.
- Current setup state or `TBD`.
- Needed inputs, access, or decisions.
- Safety/permission check.
- Next setup action.

## Boundaries

- If the user is doing business work now, route to the relevant business lane.
- If the user wants a standalone utility output, route to `opskeep-tools`.
- Do not create automations, connect tools, or write memory without explicit confirmation when the action changes external state.

## Gotchas

- Setup should capture only useful operating context: services, clients, tools, workflows, cadence, preferences, and first job.
- Tool connection status must be verified before claiming access.
- Company brain writes need user intent and a clear destination.
