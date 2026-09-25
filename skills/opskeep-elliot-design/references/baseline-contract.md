# Canonical baseline contract (schema 2.1)

Use `assets/security-baseline.template.yaml` as the canonical shape and `assets/security-baseline.example.yaml` as the reference for filled records. Keep every top-level key even when lists are empty so tools can consume a predictable document. YAML is the machine record; the dashboard and blueprint are human views of the same facts. Run `scripts/validate_baseline.py` on every draft before presenting it; do not present a baseline that fails validation.

## Invariants

- `schema_version` identifies this document contract; `baseline_version` (semver) identifies the project's reviewed design.
- IDs are immutable within a project and unique across the whole file. Prefixes: `AST-`, `CMP-`, `TB-`, `FLW-`, `ID-`, `THR-`, `CTL-`, `GATE-`, `DEC-`, `EVD-`, `MON-`, `CHG-`. Retire records with `status: RETIRED` instead of deleting or renumbering.
- Every reference (`component_ids`, `control_ids`, `evidence_ids`, `required_evidence`, `boundaries`, `resources`, `targets`) must resolve to an existing ID.
- Do not store secrets, raw credentials, personal data samples, or fabricated evidence.
- Dates use ISO 8601 (`2026-09-24` or `2026-09-24T10:00:00Z`).

## Traceability rules

- Every active threat lists at least one control.
- Every active control is referenced by at least one threat or gate. A governance control (for example the approval gate itself, `CTL-GOV-*`) is traced through its gate.
- Every active gate lists at least one control and at least one required evidence record.
- `VERIFIED` controls and gates list `evidence_ids` whose evidence is `PASSED`.

In `DRAFT`, traceability gaps are warnings. From `REVIEW_REQUIRED` onward they are errors.

## Allowed values

| Field | Values | Notes |
|---|---|---|
| `risk.tier`, `risk.likely_production_tier` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `likely_production_tier` required for `SPIKE` |
| `risk.mode` | `FAST_TRACK`, `STANDARD`, `FULL`, `SPIKE` | Minimum mode: MEDIUM→`STANDARD`, HIGH/CRITICAL→`FULL`. Escalating is allowed; downgrading is not |
| `lifecycle.status` | `DRAFT`, `REVIEW_REQUIRED`, `APPROVED`, `REJECTED`, `SUSPENDED` | |
| `lifecycle.production_posture` | `ELIGIBLE_WHEN_APPROVED`, `PRODUCTION_PROHIBITED` | `SPIKE` must be `PRODUCTION_PROHIBITED` |
| `lifecycle.development_lock` | `LOCKED`, `SANDBOX_ONLY`, `UNLOCKED` | `UNLOCKED` only when `APPROVED`; `SANDBOX_ONLY` only for `SPIKE` |
| `lifecycle.deployment_lock` | `LOCKED`, `UNLOCKED` | `UNLOCKED` only when `APPROVED` and posture is eligible; always `LOCKED` for `SPIKE` |
| likelihood / impact / residual_risk / security_impact | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (`NONE` allowed for `security_impact`) | |
| classification | `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `SENSITIVE`, `RESTRICTED` | |
| `components[].exposure` | `INTERNET`, `INTERNAL`, `PRIVATE`, `THIRD_PARTY` | |
| `identities[].type` | `HUMAN`, `WORKLOAD`, `AGENT` | |
| `threats[].status` | `OPEN`, `MITIGATED`, `ACCEPTED`, `TRANSFERRED`, `RETIRED` | `MITIGATED` requires every linked control `IMPLEMENTED` or `VERIFIED`; `ACCEPTED` requires an owner and `acceptance_reason` |
| `controls[].status`, `recovery.*.status` | `REQUIRED`, `PLANNED`, `IMPLEMENTED`, `VERIFIED`, `NOT_APPLICABLE`, `UNRESOLVED`, `RETIRED` | see below |
| `gates[].stage` | `PRE_IMPLEMENTATION`, `PULL_REQUEST`, `MERGE`, `BUILD`, `PRE_DEPLOY`, `DEPLOY`, `RUNTIME` | ordered as listed |
| `gates[].status` | `NOT_YET_BUILT`, `CONFIGURED`, `VERIFIED`, `DISABLED`, `RETIRED` | `CONFIGURED` = exists but a denial has not been observed or protection could not be inspected; `VERIFIED` = a blocked run was observed and linked |
| `decisions[].status` | `OPEN`, `DECIDED`, `DEFERRED`, `RETIRED` | `DEFERRED` with `blocks_approval: true` still blocks |
| `evidence[].type` | `OWNER_APPROVAL`, `CI_RUN`, `TEST_RESULT`, `SCAN_REPORT`, `CONFIG_INSPECTION`, `MANUAL_REVIEW`, `ATTESTATION` | |
| `evidence[].status` | `NOT_YET_BUILT`, `PENDING`, `PASSED`, `FAILED`, `STALE` | `PASSED`/`FAILED`/`STALE` require `observed_at`, `observer`, `location` |
| `monitoring.handoff.configuration_status` | `NOT_CONFIGURED`, `PLANNED`, `CONFIGURED`, `VERIFIED` | |
| `monitoring.signals[].status` | `PLANNED`, `CONFIGURED`, `VERIFIED`, `NOT_APPLICABLE`, `RETIRED` | |
| `changes[].type` | `ADDED`, `REMOVED`, `MODIFIED` | |
| `changes[].status` | `PROPOSED`, `ASSESSED`, `APPROVED`, `REJECTED` | |
| `approval.decision` | `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` | must match lifecycle, below |

Control status meaning: `REQUIRED` mandatory, implementation approach not yet set; `PLANNED` concrete approach accepted, not built; `IMPLEMENTED` present, not necessarily tested; `VERIFIED` tested with linked `PASSED` evidence; `NOT_APPLICABLE` excluded, needs a non-empty `reason`; `UNRESOLVED` gap, needs `blocks_approval: true|false`.

## Lifecycle and approval must agree

| `lifecycle.status` | `approval.decision` | Required approval fields |
|---|---|---|
| `DRAFT` | `PENDING` | none |
| `REVIEW_REQUIRED` | `PENDING` | none |
| `APPROVED` | `APPROVED` | `approver`, `approved_at`, `baseline_version` equal to the top-level one, `record_digest` equal to the computed digest, non-empty `scope` |
| `REJECTED` | `REJECTED` | `approver`, `approved_at` (decision time) |
| `SUSPENDED` | `SUSPENDED` | keep the prior approver/version/digest for audit; add the triggering `CHG-*` record |

`APPROVED` is invalid while any decision with `blocks_approval: true` is `OPEN`/`DEFERRED` or any control is `UNRESOLVED` with `blocks_approval: true`.

## Expiry

- `lifecycle.spike_expires_at` is the date a `SPIKE` sandbox must be destroyed. It is required for `SPIKE` and must be `null` otherwise.
- `approval.expires_at` is when an approval stops being valid (optional; use it for CRITICAL projects or time-boxed approvals). CI treats an expired approval as not approved.

## Record digest

The digest binds the reviewed **design**, not implementation progress, so moving a control from `PLANNED` to `IMPLEMENTED` or recording a CI run does not invalidate an approval, while changing a requirement, flow, identity, threat, boundary, or decision does.

Compute it as SHA-256 over the canonical JSON (sorted keys, no whitespace, UTF-8) of the document after removing:

- top-level `record_digest`, `approval`, and `evidence`;
- `lifecycle.status`, `lifecycle.development_lock`, `lifecycle.deployment_lock`;
- `monitoring.handoff` (its own copy of version/digest and handoff timestamps);
- the `status` and `evidence_ids` fields of every control, gate, threat, and monitoring signal, and the `status` of each `recovery` item.

Never type a digest by hand. Run `python scripts/validate_baseline.py FILE --print-digest` and copy the result into both `record_digest` and `approval.record_digest` at approval time.
