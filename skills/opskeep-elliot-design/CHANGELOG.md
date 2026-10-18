# Changelog

## 2.5.1
- The project gate section now reuses an approved Opskeep-project-gate package: its `intake.yaml` has the same shape as `project.intake`, so the questions are not asked twice.

## 2.5.0 — project gate
- New "Project gate" section in `SKILL.md`: six questions answered before any design (constraint, forces on the people served, existing assets, the bet, outcomes not activities, one recommendation with rejected paths), recorded in `project.intake`.
- Validator (schema 2.3): `project.intake` is required in every 2.3 baseline. LOW needs `constraint.statement`; MEDIUM and above also need constraint evidence, the four forces, `existing_assets`, the four-part `bet`, `outcomes` and at least one `rejected_options` entry. Schema 2.2 baselines are unaffected. 2.3 baselines written with 2.4.0 need an `intake` block added.
- Template and example updated; 4 new tests (58 total).

## 2.4.0 — schema 2.3: checklist topics become required fields
- New top-level blocks: `capabilities`, `source`, `engineering`, and `ai_profile` (required when AI or an agent is present). `risk.assurance.slsa_source_level` (policy minimum LOW 1 to CRITICAL 4) is validated against the `source` settings. SLSA build level 3 requires `supply_chain.build_hardening`. `vulnerability_management` gains `monitoring_sources`, `triage_method` (MEDIUM+) and `root_cause_practice` (HIGH+). `project.executive_sponsor` is required at HIGH+.
- Declared practices cover SSDF PO.3, PO.5, PS.3, PW.5-PW.8, RV.1-RV.3, OWASP A08, LLM03/04/07/08/09, ASI06-ASI10, ASVS V5/V9/V10/V15 and the CISA vulnerability-class item. The validator requires them to be stated; it does not judge their quality.
- Crosswalk statuses updated only where a check now exists. Computed coverage: 99.4% of 80 items (one item, CISA leadership, stays PARTIAL). That figure measures what the skill requires, not how well a project meets a standard.
- Schema 2.2 baselines still validate with a warning and keep their digest. 11 new tests (54 total).

## 2.3.0 — schema 2.2: closes approval-gate bypasses, adds standards alignment
Security fixes to the approval gate (each has a regression test named `exploit_*`):
- `--require-approved` now **fails unless a protected `--expected-digest` is supplied** (or `$EXPECTED_BASELINE_DIGEST`). Previously a forgotten flag produced a green gate with a warning. `--allow-self-asserted` is the explicit, local-only escape hatch.
- Production scope is no longer a substring match. `approval.scope` entries must start with `sandbox`, `development`, `staging` or `production`; text such as "production excluded" is rejected at lint time and cannot satisfy a gate.
- The digest now **binds `approval.scope`**, so widening scope to production (and unlocking deploys) in the same pull request breaks the protected digest.
- The digest now **keeps weakening statuses** (`RETIRED`, `NOT_APPLICABLE`, `UNRESOLVED`, `DISABLED`, `ACCEPTED`, `TRANSFERRED`) and folds only pure progress statuses to `ACTIVE`. Retiring a control after approval no longer passes the gate.
- Active threats and gates may not reference `RETIRED` controls.
- An expired `SPIKE` (`spike_expires_at` in the past) now fails validation; a `SPIKE` can target only `development` and may not name `staging`/`production` in its scope.
- Malformed files (wrong shapes, bad YAML, internal errors) now fail with a clean message and exit 1 or 2 instead of a traceback.
- Digest canonicalises timestamps to UTC `Z`, so YAML quoting or offset style no longer changes it.

Standards alignment (new):
- `references/standards-crosswalk.yaml` maps the skill to OWASP Top 10:2025, OWASP LLM Top 10 2025, OWASP Agentic Top 10 2026, NIST SSDF 1.1, SLSA 1.2, CISA Secure by Design and ASVS 5.0 (chapters V1-V17), with a `basis` (PRIMARY, CROSS_CHECKED, RECALLED) per standard or item, `verified` true only for PRIMARY, and a `verified_on` date. SLSA Source track is split into L1-L4; CISA items not found in a source are marked RECALLED.
- `scripts/standards_coverage.py` scores the crosswalk (COVERED 1, PARTIAL 0.5), validates it, and fails below a threshold (default 80%).
- Control domains: 18-value `controls[].domain` enum; required domains per tier (7 / 15 / 18); `AI_AGENT` required whenever AI or an agent is present. Question sets in `references/control-domains.md`; AI checklist AG-01 to AG-12 in `references/ai-agent-controls.md`.
- `risk.assurance` (ASVS level and SLSA build level targets by tier, policy minimums with `deviation_reason`).
- `supply_chain` block (SBOM, provenance, dependency policy, vulnerability management with remediation SLA, disclosure and support policy).
- `project.regulatory_context` and `components[].ai_capability`.
- `controls[].refs` / `threats[].refs` validated against the crosswalk.

Process:
- LOW / FAST_TRACK projects may collapse `ARCHITECTURE.md` and `GUI.md` into sections of `README.md`.
- `ci-enforcement.md` rewritten: protected digest sources, the validator and workflow as part of the trust base, example workflow shape.
- Test suite expanded from 21 to 43 cases.

Migrating 2.1 baselines: see "Migrating 2.1 to 2.2" in `references/baseline-contract.md`. 2.1 files still validate (with a warning) and keep their 2.1 digest. The 2.2 digest differs by design, so re-approve and update the protected digest.

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
- Added `scripts/validate_baseline.py` (lint, `--require-approved` CI gate, `--print-digest`) and `scripts/test_validate_baseline.py`.
