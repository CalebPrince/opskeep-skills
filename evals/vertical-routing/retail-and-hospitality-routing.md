# Eval: the router hands shop and venue work to the vertical packs

## Scenario

A user invokes Opskeep from a stock-and-sell business and from a table-service business,
not from a project-service business: "Opskeep, we're low on SKUs for the weekend drop,
should I reorder the caps?" and "Opskeep, tonight's prep list is risky, one service
station is short-staffed at the venue."

## Setup

- Core `opskeep` router is loaded.
- `opskeep-retail` and `opskeep-hospitality` are sibling packs staged under
  `verticals/<pack>/skills/`, each with its own router and six lanes.
- The eval treats a pack as installed only when the environment actually has it.

## Expected behavior

1. Retail/shop intent routes to the `opskeep-retail` router (stock-up lane intent), not
   to `opskeep-get-work`, `opskeep-deliver-work`, or `opskeep-get-paid`.
2. Hospitality/venue intent routes to the `opskeep-hospitality` router (plan-service /
   serve intent), not to a core service lane.
3. When the matching vertical pack is not installed, the router returns the install path
   (clone + copy `verticals/<pack>/skills/*`) and does not invent or run
   `opskeep-retail-*` / `opskeep-hospitality-*` skills as though they were present.

## Pass criteria

- Shop/venue phrasing never lands in a core service lane.
- No fabricated vertical lane output when the matching pack isn't installed.
- Output keeps a concrete next action, owner, and `TBD` for unknowns.