# Canonical baseline contract (schema 2.3)

Schema 2.3 adds `capabilities`, `source`, `engineering`, `ai_profile`, `risk.assurance.slsa_source_level`, `supply_chain.build_hardening` and extra `vulnerability_management` fields; see [engineering practices](engineering-practices.md) for every key and tier. Everything below that says 2.2 still applies.

### Migrating 2.2 to 2.3

1. Set `schema_version: "2.3"`; add `capabilities`, `source`, `engineering` and `risk.assurance.slsa_source_level` (copy shapes from the template).
2. State the engineering practices required at your tier, add `ai_profile` if AI or an agent is present, and fill `monitoring_sources`, `triage_method` and (HIGH+) `root_cause_practice`.
3. Recompute the digest with `--print-digest`. The algorithm is unchanged, but the new blocks are part of the design, so an existing approval must be re-confirmed.

Use `assets/security-baseline.template.yaml` as the canonical shape and `assets/security-baseline.example.yaml` as the reference for filled records. Keep every top-level key even when lists are empty so tools can consume a predictable document. YAML is the machine record; the dashboard and blueprint are human views of the same facts. Run `scripts/validate_baseline.py` on every draft before presenting it; do not present a baseline that fails validation.

## Invariants

- `schema_version` identifies this document contract; `baseline_version` (semver) identifies the project's reviewed design. Schema 2.1 documents still validate, with a migration warning, and keep their 2.1 digest.
- IDs are immutable within a project and unique across the whole file. Prefixes: `AST-`, `CMP-`, `TB-`, `FLW-`, `ID-`, `THR-`, `CTL-`, `GATE-`, `DEC-`, `EVD-`, `MON-`, `CHG-`. Retire records with `status: RETIRED` instead of deleting or renumbering.
- Every reference (`component_ids`, `control_ids`, `evidence_ids`, `required_evidence`, `boundaries`, `resources`, `targets`) must resolve to an existing ID.
- Do not store secrets, raw credentials, personal data samples, or fabricated evidence.
- Dates use ISO 8601 (`2026-09-24` or `2026-09-24T10:00:00Z`).

## Traceability rules

- Every active threat lists at least one control, and none of its controls may be `RETIRED`.
- Every active control is referenced by at least one threat or gate. A governance control (for example the approval gate itself, `CTL-GOV-*`) is traced through its gate.
- Every active gate lists at least one control (none `RETIRED`) and at least one required evidence record.
- `VERIFIED` controls and gates list `evidence_ids` whose evidence is `PASSED`.
- Every control has a `domain` from the 18 domains in `control-domains.md`, and every domain required for the tier is addressed (see that file).

In `DRAFT`, traceability and coverage gaps are warnings. From `REVIEW_REQUIRED` onward they are errors.

## Allowed values

| Field | Values | Notes |
|---|---|---|
| `risk.tier`, `risk.likely_production_tier` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | `likely_production_tier` required for `SPIKE` |
| `risk.mode` | `FAST_TRACK`, `STANDARD`, `FULL`, `SPIKE` | Minimum mode: MEDIUM→`STANDARD`, HIGH/CRITICAL→`FULL`. Escalating is allowed; downgrading is not |
| `risk.assurance.asvs_level` | `L1`, `L2`, `L3`, `NOT_APPLICABLE` | Policy minimum by tier: LOW `L1`, MEDIUM `L2`, HIGH `L2`, CRITICAL `L3`. Lower needs `deviation_reason`; `NOT_APPLICABLE` needs `asvs_reason`. These minimums are this skill's policy, not text from ASVS |
| `risk.assurance.slsa_build_level` | integer `0`–`3` | Policy minimum: LOW 1, MEDIUM 1, HIGH 2, CRITICAL 3. Lower needs `deviation_reason` |
| `lifecycle.status` | `DRAFT`, `REVIEW_REQUIRED`, `APPROVED`, `REJECTED`, `SUSPENDED` | |
| `lifecycle.production_posture` | `ELIGIBLE_WHEN_APPROVED`, `PRODUCTION_PROHIBITED` | `SPIKE` must be `PRODUCTION_PROHIBITED` |
| `lifecycle.development_lock` | `LOCKED`, `SANDBOX_ONLY`, `UNLOCKED` | `UNLOCKED` only when `APPROVED`; `SANDBOX_ONLY` only for `SPIKE` |
| `lifecycle.deployment_lock` | `LOCKED`, `UNLOCKED` | `UNLOCKED` only when `APPROVED` and posture is eligible; always `LOCKED` for `SPIKE` |
| `approval.scope[]` | entries starting with `sandbox`, `development`, `staging` or `production`, optionally `:detail` | Free text is rejected so "production excluded" can never satisfy a production check. A `SPIKE` may name only `sandbox`/`development` |
| likelihood / impact / residual_risk / security_impact | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` (`NONE` allowed for `security_impact`) | |
| classification | `PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `SENSITIVE`, `RESTRICTED` | |
| `components[].exposure` | `INTERNET`, `INTERNAL`, `PRIVATE`, `THIRD_PARTY` | |
| `components[].ai_capability` | `true`/`false` (optional) | `true` makes the `AI_AGENT` domain required at any tier |
| `identities[].type` | `HUMAN`, `WORKLOAD`, `AGENT` | An `AGENT` identity also makes `AI_AGENT` required |
| `controls[].domain` | `AUTH`, `AUTHZ`, `SESSION`, `INPUT`, `API`, `FILE`, `FRONTEND`, `CRYPTO`, `SECRETS`, `CONFIG`, `DATA`, `ERROR_HANDLING`, `LOGGING`, `SUPPLY_CHAIN`, `DEPLOY`, `RECOVERY`, `AI_AGENT`, `GOVERNANCE` | Required in 2.2 |
| `controls[].refs`, `threats[].refs` | `STANDARD:ITEM` ids that exist in `references/standards-crosswalk.yaml` | Optional; format and existence are checked |
| `threats[].status` | `OPEN`, `MITIGATED`, `ACCEPTED`, `TRANSFERRED`, `RETIRED` | `MITIGATED` requires every linked control `IMPLEMENTED` or `VERIFIED`; `ACCEPTED` requires an owner and `acceptance_reason` |
| `controls[].status`, `recovery.*.status`, `supply_chain.*.status` | `REQUIRED`, `PLANNED`, `IMPLEMENTED`, `VERIFIED`, `NOT_APPLICABLE`, `UNRESOLVED`, `RETIRED` | see below |
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
| `project.regulatory_context[].status` | `APPLICABLE`, `NOT_APPLICABLE`, `NOT_ASSESSED` | `NOT_APPLICABLE` needs `notes`; list required non-empty from MEDIUM; `NOT_ASSESSED` cannot be approved at HIGH/CRITICAL |
| `supply_chain.sbom.format` | `CYCLONEDX`, `SPDX`, `NONE` | `required: true` needs a format; `required` must be `true` from HIGH |
| `supply_chain.dependency_policy.vulnerability_gate_severity` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `NONE` | `NONE` not allowed from MEDIUM |

Control status meaning: `REQUIRED` mandatory, implementation approach not yet set; `PLANNED` concrete approach accepted, not built; `IMPLEMENTED` present, not necessarily tested; `VERIFIED` tested with linked `PASSED` evidence; `NOT_APPLICABLE` excluded, needs a non-empty `reason`; `UNRESOLVED` gap, needs `blocks_approval: true|false`.

## Supply chain block (new in 2.2)

```yaml
supply_chain:
  sbom: {required: bool, format: CYCLONEDX|SPDX|NONE, status: <control status>, reason: ""}
  provenance: {status: <control status>, details: ""}
  dependency_policy: {lockfile_required: bool, update_automation: "", vulnerability_gate_severity: LOW..CRITICAL|NONE}
  vulnerability_management:
    status: <control status>
    remediation_sla_days: int|null      # required from MEDIUM
    disclosure: ""                      # how to report a vulnerability; required from MEDIUM
    support_policy: ""                  # how long fixes are provided; required from MEDIUM
    details: ""
```

The SLSA build target lives in `risk.assurance.slsa_build_level`. Provenance status describes whether the build actually produces and publishes that provenance.

## Lifecycle and approval must agree

| `lifecycle.status` | `approval.decision` | Required approval fields |
|---|---|---|
| `DRAFT` | `PENDING` | none |
| `REVIEW_REQUIRED` | `PENDING` | none (propose `approval.scope` now: it is part of the digest) |
| `APPROVED` | `APPROVED` | `approver`, `approved_at`, `baseline_version` equal to the top-level one, `record_digest` equal to the computed digest, non-empty `scope` |
| `REJECTED` | `REJECTED` | `approver`, `approved_at` (decision time) |
| `SUSPENDED` | `SUSPENDED` | keep the prior approver/version/digest for audit; add the triggering `CHG-*` record |

`APPROVED` is invalid while any decision with `blocks_approval: true` is `OPEN`/`DEFERRED` or any control is `UNRESOLVED` with `blocks_approval: true`.

## Expiry

- `lifecycle.spike_expires_at` is the date a `SPIKE` sandbox must be destroyed. It is required for `SPIKE`, must be `null` otherwise, and a `SPIKE` whose date has passed fails validation.
- `approval.expires_at` is when an approval stops being valid (optional; use it for CRITICAL projects or time-boxed approvals). CI treats an expired approval as not approved.

## Record digest (schema 2.2)

The digest binds the reviewed **design and approval scope**, not implementation progress.

Compute it as SHA-256 over the canonical JSON (sorted keys, no whitespace, UTF-8) of the document after:

- removing top-level `record_digest`, the `approval` block (its `scope` is re-added as a sorted, lower-cased `approval_scope` list) and `evidence`;
- removing `lifecycle.status`, `lifecycle.development_lock`, `lifecycle.deployment_lock` and `monitoring.handoff`;
- removing `evidence_ids` from every control, gate, threat and monitoring signal;
- **folding progress statuses to `ACTIVE`**: controls and recovery/supply-chain items `REQUIRED|PLANNED|IMPLEMENTED|VERIFIED`; gates `NOT_YET_BUILT|CONFIGURED|VERIFIED`; threats `OPEN|MITIGATED`; signals `PLANNED|CONFIGURED|VERIFIED`;
- **keeping weakening statuses in the digest**: `RETIRED`, `NOT_APPLICABLE`, `UNRESOLVED`, `DISABLED`, `ACCEPTED`, `TRANSFERRED`;
- canonicalising timestamps (YAML datetimes and ISO strings alike) to UTC `YYYY-MM-DDTHH:MM:SSZ`, so quoting or offset style does not change the digest.

Consequences: moving a control from `PLANNED` to `IMPLEMENTED` or recording a CI run does not invalidate an approval; retiring a control, marking it not applicable, disabling a gate, accepting a threat, or widening the approval scope does, and CI then fails against the protected digest.

Never type a digest by hand. Run `python scripts/validate_baseline.py FILE --print-digest` and copy the result into both `record_digest` and `approval.record_digest` at approval time, and store the same value in a protected source (see `ci-enforcement.md`).

## Migrating 2.1 to 2.2

1. Set `schema_version: "2.2"` and add `project.regulatory_context`, `risk.assurance`, and the `supply_chain` block (copy shapes from the template).
2. Give every control a `domain` from the 18-value list and add controls or reasoned `NOT_APPLICABLE` entries for any domain the validator reports missing.
3. Convert `approval.scope` to environment-token entries (`development`, `production:eu-region`, and so on).
4. Remove any `retired` control still referenced by an active threat or gate.
5. Recompute the digest with `--print-digest`. The 2.2 digest differs from the 2.1 digest by design, so an existing approval must be re-confirmed by the owner and the protected digest updated.
