# Opskeep Retail Improve Operations Reference

Use to produce a specific operating change, not a general performance narrative.

## Starter Jobs

- Review sell-through for a SKU/product line/collection.
- Assess whether a past markdown moved stock at the intended margin.
- Review a shrinkage figure and its likely driver.
- Propose a reorder-point adjustment based on actual velocity.

## Required Inputs

- Sales/sell-through data for the period in question, or `TBD`.
- The original plan being reviewed against (target margin, markdown depth, reorder
  point), from `opskeep-retail-plan-drop`/`opskeep-retail-stock-up` context.
- Stock-count vs. sales-record data, for shrinkage.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live sales/inventory history when connected.
- `opskeep-retail-manage`: connector setup/status if nothing is connected yet.

## Workflow

1. State the objective: sell-through review, markdown effectiveness, shrinkage, or
   reorder-point tuning.
2. Gather the actual data and the original plan/target it's being compared against. Mark
   missing inputs `TBD`.
3. Compare actual to plan; name the gap and its most likely driver, grounded in evidence.
4. Convert the finding into one concrete next-cycle change: a new reorder point, a
   markdown-timing adjustment, or a SKU retire/keep call.
5. Name where that change gets applied (`opskeep-retail-stock-up` for reorder points,
   `opskeep-retail-plan-drop` for pricing/markdown timing) and who owns making it.

## Output Shape

- `Metric/lesson`: concise finding.
- `Evidence`: source data, or `TBD`.
- `Next-cycle change`: specific, applicable change.
- `Owner`: person or `TBD`.
- `Apply in`: which lane skill executes the change.
- `Follow-ups`: unresolved items.

## Rules

- Do not declare a SKU underperforming without sell-through evidence.
- Do not propose a reorder-point number without stating the velocity it's based on.
- Turn findings into a specific change, not a general "watch this" note.
