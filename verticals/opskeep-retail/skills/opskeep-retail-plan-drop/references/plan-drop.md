# Opskeep Retail Plan The Drop Reference

Use to produce a pricing, launch, or markdown decision, not a general merchandising
opinion.

## Starter Jobs

- Price a new SKU/product line against a target margin.
- Build or adjust a launch calendar for a season/collection.
- Decide markdown timing and depth on aging or slow-moving stock.
- Choose what's featured/phased out for the upcoming cycle.

## Required Inputs

- Cost basis for the SKU(s) in question, or `TBD`.
- Target margin (shop's standard, or stated for this line), or `TBD`.
- Prior sell-through for comparable items, if available, or `TBD`.
- Season/calendar constraint (launch window, must-sell-by date), if any.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): historical sell-through/sales data when
  connected, to ground pricing and markdown calls in evidence rather than guesses.
- `opskeep-retail-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: price a new line, build a launch calendar, or call a markdown.
2. Gather cost basis, target margin, and any prior sell-through evidence. Mark missing
   inputs `TBD`.
3. For pricing: compute price from cost basis + target margin; flag if this is above/below
   comparable prior lines and why.
4. For markdown: state the reason (aging, season end, margin already banked), propose
   depth and timing, and note the expected effect on sell-through if known.
5. For launch calendars: sequence by season/constraint, name what's featured and what's
   being phased out, and flag any date conflicts.
6. Hold for explicit confirmation before treating a price/markdown as live.

## Output Shape

- `Item/collection`: what's being priced or scheduled.
- `Decision`: price, markdown depth, or calendar slot.
- `Target margin`: stated, with resulting margin at this price.
- `Effective date`: when it goes live.
- `Rationale`: evidence-based reason, or `TBD`.
- `Status`: draft, pending confirmation.

## Rules

- Never state a margin or sell-through figure that wasn't given or pulled from a
  connected source.
- A markdown without a stated reason is not a complete answer — ask or mark `TBD`.
- Treat "the price" as provisional until the user confirms it goes live.
