# Opskeep Hospitality Improve Operations Reference

Use to produce a specific operating change, not a general performance narrative.

## Starter Jobs

- Review food cost percentage for a dish/category against target.
- Review the waste log and identify the biggest driver.
- Review labor percent of sales for a period.
- Track inspection readiness: temp logs current, allergen info posted, certifications
  current.

## Required Inputs

- Sales and cost data for the period in question, or `TBD`.
- The original plan being reviewed against (target food cost %, staffing plan), from
  `opskeep-hospitality-plan-service` context.
- Waste log entries, for waste review.
- Certification/temp-log records, for inspection readiness.

## Connected Capabilities

- `composio-mcp` (via `opskeep-tools`): live POS/payroll data when connected.
- `opskeep-hospitality-manage`: connector setup/status and certification records if
  nothing is connected yet.

## Workflow

1. State the objective: food cost review, waste review, labor review, or inspection
   readiness.
2. Gather the actual data and the original plan/target it's being compared against. Mark
   missing inputs `TBD`.
3. Compare actual to plan; name the gap and its most likely driver, grounded in evidence.
4. Convert the finding into one concrete next-cycle change: a plate-cost adjustment, a
   waste-reduction note, or a staffing change.
5. For inspection readiness, report checklist status (current/expired/missing per item)
   without rendering a pass/fail compliance judgment.
6. Name where a change gets applied (`opskeep-hospitality-plan-service` for
   menu/staffing, `opskeep-hospitality-stock-up` for ordering adjustments) and who owns
   making it.

## Output Shape

- `Metric/lesson`: concise finding.
- `Evidence`: source data, or `TBD`.
- `Next-cycle change`: specific, applicable change.
- `Owner`: person or `TBD`.
- `Apply in`: which lane skill executes the change.
- `Follow-ups`: unresolved items.

## Rules

- Do not declare a dish overpriced or waste "normal" without evidence.
- Do not propose a staffing or plate-cost change without stating the data it's based on.
- Report inspection readiness as checklist status only; never assert compliance or
  legality.
- Turn findings into a specific change, not a general "watch this" note.
