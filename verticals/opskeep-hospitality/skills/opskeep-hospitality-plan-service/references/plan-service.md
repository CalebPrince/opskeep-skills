# Opskeep Hospitality Plan Service Reference

Use to produce a menu, prep, or staffing decision, not a general operations opinion.

## Starter Jobs

- Plan or adjust the menu for an upcoming service/season, including plate pricing.
- Build a prep list sized to expected covers.
- Staff a shift rota against expected volume and known staff availability.

## Required Inputs

- Food cost basis per dish, or `TBD`.
- Target food cost percentage (venue's standard, or stated for this menu), or `TBD`.
- Expected covers/reservations for the period, if available, or `TBD`.
- Staff availability and certifications for the shifts being planned.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): reservation volume and historical covers when
  connected, to ground prep and staffing in evidence rather than guesses.
- `opskeep-hospitality-manage`: connector setup/status and staff certification records if
  nothing is connected yet.

## Workflow

1. State the objective: menu/pricing, prep list, or shift rota.
2. Gather food cost basis, target percentage, and expected covers/staff availability.
   Mark missing inputs `TBD`.
3. For menu/pricing: compute plate price from food cost basis + target percentage; flag
   if it's above/below comparable dishes and why.
4. For prep: size quantities to expected covers plus a stated buffer; flag anything that
   depends on an ingredient not yet confirmed in stock (hand off to
   `opskeep-hospitality-stock-up`).
5. For staffing: match shifts to expected volume and available, certified staff; flag any
   understaffed shift or expiring certification explicitly.
6. Hold for explicit confirmation before treating a menu/price change or published rota
   as final.

## Output Shape

- `Item/shift`: what's being planned.
- `Decision`: dish/price, prep quantity, or staff assignment.
- `Target food cost %`: stated, with resulting percentage at this price.
- `Effective date/window`: when it applies.
- `Rationale`: evidence-based reason, or `TBD`.
- `Status`: draft, pending confirmation.

## Rules

- Never state a food cost percentage or covers figure that wasn't given or pulled from a
  connected source.
- A rota gap or expiring certification is always named, never left implicit.
- Treat "the menu" or "the rota" as provisional until the user confirms it goes live.
