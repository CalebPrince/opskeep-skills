---
name: opskeep-hospitality-manage
description: "Use when the user wants to operate Opskeep Hospitality itself: onboard Opskeep Hospitality into a restaurant/venue, update venue/cuisine profile, manage staff roster and certifications, connect POS/reservation/delivery tools, or audit what Opskeep Hospitality knows and can access."
lane: meta
metadata:
  version: 0.1.0
---

# Opskeep Hospitality Manage

Set up and maintain Opskeep Hospitality as the venue's operations agent.

## Use For

- Onboarding Opskeep Hospitality into a venue: cuisine/menu profile, suppliers, staff,
  POS/reservation/delivery platforms, cadence, and first job.
- Venue profile, staff roster, and certification records.
- Connected tool setup, connector status, and Composio connection readiness.
- Daypart and multi-location scoping when the venue has more than one service period or
  location.

## References

- Load `references/connectors.md` for POS/reservation/delivery-platform connector setup,
  status, and Composio connection readiness.

## Output Contract

- Configuration objective.
- Current setup state or `TBD`.
- Needed inputs, access, or decisions.
- Safety/permission check.
- Next setup action.

## Boundaries

- If the user is doing venue work now, route to the relevant lane skill.
- If the user wants a standalone shared utility, route to `opskeep-tools`.
- Do not connect tools, or write venue profile data, without explicit confirmation when
  the action changes external state.

## Gotchas

- Setup should capture only useful operating context: cuisine/menu profile, suppliers,
  staff and certifications, POS/reservation/delivery platforms, cadence, preferences, and
  first job.
- Tool connection status must be verified before claiming access.
- Certification records inform other lanes' compliance flags (see
  `opskeep-hospitality-stock-up` and `opskeep-hospitality-plan-service`); keep them
  current, but this skill doesn't determine legal compliance itself.
- One venue and one continuous service is the default assumption; if the venue has
  multiple daypart or locations, capture that during setup so lane skills know to ask.
