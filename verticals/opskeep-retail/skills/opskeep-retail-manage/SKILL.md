---
name: opskeep-retail-manage
description: "Use when the user wants to operate Opskeep Retail itself: onboard Opskeep Retail into a shop, update shop/product/supplier profile, manage staff roster, connect POS/inventory tools, or audit what Opskeep Retail knows and can access."
metadata:
  lane: meta
  version: 0.1.0
---

# Opskeep Retail Manage

Set up and maintain Opskeep Retail as the shop's operations agent.

## Use For

- Onboarding Opskeep Retail into a shop: products, suppliers, staff, POS, cadence, and
  first job.
- Shop profile, product/supplier catalog reference, and preferences.
- Connected tool setup, connector status, and Composio connection readiness.
- Multi-location scoping when the shop has more than one location.
- Setting how much autonomy the agent has to complete a sale on its own versus holding
  every message for review.

## References

- Load `references/connectors.md` for POS/inventory/supplier connector setup, status, and
  Composio connection readiness.
- Load `references/transaction-autonomy.md` for setting or changing autonomous-sale mode
  and its escalation triggers.

## Output Contract

- Configuration objective.
- Current setup state or `TBD`.
- Needed inputs, access, or decisions.
- Safety/permission check.
- Next setup action.

## Boundaries

- If the user is doing shop work now, route to the relevant lane skill.
- If the user wants a standalone shared utility, route to `opskeep-tools`.
- Do not connect tools, or write shop profile data, without explicit confirmation when the
  action changes external state.

## Gotchas

- Setup should capture only useful operating context: products, suppliers, staff, POS
  platform, cadence, preferences, and first job.
- Tool connection status must be verified before claiming access.
- One shop location is the default assumption; if the shop has multiple locations, capture
  that during setup so lane skills know to ask which location a request applies to.
- Default every lane to `approval_required`. Turning on `autonomous_with_escalation` for
  a lane is a real behavior change; require explicit confirmation restating exactly what
  it authorizes before applying it.
