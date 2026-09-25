# Changelog

## 2.2.0 — required project artifacts
- Standardized `README.md`, `GUI.md`, `SECURITY.md`, and `ARCHITECTURE.md` across discovery, pre-build review, implementation handoff, verification, and material-change reassessment.
- Added tool-agnostic artifact templates and precedence rules while preserving `security-baseline.yaml` as the canonical security record.
- Added a GUI capability matrix with `WORKING`, `PARTIAL`, `MOCK ONLY`, and `NOT BUILT`, full UI-state coverage, backend/data/auth contracts, responsive and accessibility requirements, and explicit backend/security/business-logic boundaries.
- Added representative shell, collection, and detail/form interface samples plus semantic design-token examples.

## 2.1.0 — schema 2.1
- Allowed values defined for every status/enum field (threats, gates, decisions, evidence, monitoring, changes, approval).
- Lifecycle ↔ approval mapping table; `SUSPENDED` now has a matching `approval.decision`.
- Design digest defined (excludes approval, evidence, and implementation-progress fields) — no longer circular; progress no longer invalidates an approval.
- `development_lock` / `deployment_lock` are now enums; `SANDBOX_ONLY` for SPIKE.
- `lifecycle.expires_at` → `lifecycle.spike_expires_at`; `approval.expires_at` governs approval validity.
- Traceability rules (threat→control, control→threat/gate, gate→control+evidence); example fixed to follow them (`CTL-GOV-001`, `THR-002`, `THR-003`).
- Added `scripts/validate_baseline.py` (lint, `--require-approved` CI gate, `--print-digest`) and `scripts/test_validate_baseline.py` (21 cases).

Migrating 2.0 baselines: set `schema_version: "2.1"`, convert lock booleans (`true`→`LOCKED`, `false`→`UNLOCKED`), rename `lifecycle.expires_at`, add `reason` to `NOT_APPLICABLE` items, then run the validator and fix what it reports.
