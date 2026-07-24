---
name: opskeep-hospitality-improve-operations
description: "Use when the user wants Opskeep Hospitality to improve how the restaurant/venue runs: food cost percentage, waste log review, labor percent of sales, and inspection readiness."
metadata:
  lane: improve-operations
  version: 0.1.0
---

# Opskeep Hospitality Improve Operations

Turn a service cycle into a better-run next one.

## Use For

- Food cost percentage review by dish or category.
- Waste log review and driver identification.
- Labor percent of sales review.
- Inspection-readiness tracking (this skill owns the checklist/status, not compliance
  adjudication).

## References

- Load `references/improve-operations.md` for the lane workflow.

## Output Contract

- Metric or lesson.
- Evidence.
- What changes next cycle (a specific plate-cost adjustment, waste-reduction note, or
  staffing change).
- Owner and reuse location or `TBD`.
- Follow-ups.
- Inspection-readiness status, when relevant, as a checklist state — not a legal
  determination.

## Boundaries

- Venue profile, connector, or preference setup goes to `opskeep-hospitality-manage`.
- Do not declare a dish overpriced/underpriced or waste "normal" without evidence.
- Plate-cost or menu changes proposed here get applied in
  `opskeep-hospitality-plan-service`, not executed directly.
- Inspection-readiness tracking is a checklist status (temp logs current, allergen info
  posted, certifications current), not a pass/fail legal judgment — that's the inspector's
  call.

## Gotchas

- Do not store memory or update docs externally unless the user asks and the tool/workflow
  exists.
- A lesson should become a concrete change (plate cost, waste reduction, staffing), not a
  general observation.
- Labor and food cost percentages need a source (POS/payroll data); don't estimate one.
