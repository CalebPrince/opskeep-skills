---
name: opskeep-retail-improve-operations
description: "Use when the user wants Opskeep Retail to improve how the shop runs: sell-through review, markdown effectiveness, shrinkage, and reorder-point tuning."
metadata:
  lane: improve-operations
  version: 0.1.0
---

# Opskeep Retail Improve Operations

Turn a sales cycle into a better-run next one.

## Use For

- Sell-through review by SKU or product line.
- Markdown effectiveness: did it move stock at the margin intended.
- Shrinkage review.
- Reorder-point tuning based on actual velocity.

## References

- Load `references/improve-operations.md` for the lane workflow.

## Output Contract

- Metric or lesson.
- Evidence.
- What changes next cycle (a specific reorder-point adjustment, markdown-timing note, or
  SKU retire/keep call).
- Owner and reuse location or `TBD`.
- Follow-ups.

## Boundaries

- Shop profile, connector, or preference setup goes to `opskeep-retail-manage`.
- Do not declare a SKU underperforming or a markdown ineffective without sell-through
  evidence.
- Reorder-point changes proposed here get applied in `opskeep-retail-stock-up`, not
  executed directly.

## Gotchas

- Do not store memory or update docs externally unless the user asks and the tool/workflow
  exists.
- A lesson should become a concrete change (reorder point, markdown timing, SKU
  retire/keep), not a general observation.
- Shrinkage figures need a source (stock count vs. sales record); don't estimate one.
