# Engineering practices, source control and capabilities (schema 2.3)

Schema 2.3 turns the topics the crosswalk used to leave as checklist questions into required fields. The validator can require that a practice is **stated** at the right tier. It cannot judge whether the practice is good: that is what evidence records, review and the owner's approval are for.

## Practice records

Each practice is a map:

```yaml
engineering:
  secure_coding: {status: "PLANNED", practice: "OWASP cheat sheets as the team standard; lint rules for unsafe sinks"}
  build_hardening: {status: "NOT_APPLICABLE", reason: "Interpreted language; no compile step"}
```

`status` is a control status. `NOT_APPLICABLE` needs a `reason`. Progress statuses (REQUIRED, PLANNED, IMPLEMENTED, VERIFIED) never change the design digest; moving to `NOT_APPLICABLE` does.

## `engineering` keys

| Key | Required from | State | Standards |
|---|---|---|---|
| `toolchain_security` | MEDIUM | How CI and build tooling is secured | SSDF PO.3 |
| `dev_environment` | MEDIUM | How developer and build environments are protected | SSDF PO.5 |
| `secure_coding` | MEDIUM | The coding standard or review rubric | SSDF PW.5, ASVS V15 |
| `code_review` | MEDIUM | How code is reviewed or statically analysed | SSDF PW.7 |
| `security_testing` | MEDIUM | Static, dynamic, dependency, fuzz, abuse-case strategy | SSDF PW.8 |
| `release_archive` | MEDIUM | How releases and provenance are archived, and for how long | SSDF PS.3 |
| `data_integrity` | MEDIUM | Signatures, safe deserialization, tamper evidence | OWASP A08 |
| `vulnerability_class_reduction` | MEDIUM | Plan to remove whole vulnerability classes (framework fixes, memory-safe language or roadmap) | CISA Secure by Design |
| `build_hardening` | HIGH | Compiler, interpreter and build hardening | SSDF PW.6 |
| `file_handling` | when `capabilities.handles_files` | Type and size limits, storage outside web root, scanning | ASVS V5 |
| `token_validation` | when `capabilities.uses_self_contained_tokens` | Signature, audience, expiry, algorithm allow-list, revocation | ASVS V9 |
| `federated_login` | when `capabilities.uses_federated_login` | Redirect validation, state/nonce, PKCE, token handling | ASVS V10 |

Also at MEDIUM+: `supply_chain.vulnerability_management.monitoring_sources` (SSDF RV.1) and `triage_method` (RV.2). At HIGH+: `root_cause_practice` (RV.3) and `project.executive_sponsor` (CISA: lead from the top).

## `capabilities`

Three booleans, required in every 2.3 baseline: `handles_files`, `uses_self_contained_tokens`, `uses_federated_login`. A `true` value switches on the matching practice above. `handles_files: true` also makes the `FILE` control domain required at every tier (it is already required at HIGH+).

## `source` and `risk.assurance.slsa_source_level`

SLSA Source track levels, declared by the owner and checked for internal consistency:

| Level | SLSA name | Fields that must be set |
|---|---|---|
| 1 | Version controlled | `source.repository` |
| 2 | History and provenance | `source.protected_branch: true`, `source.history_protected: true` |
| 3 | Continuous technical controls | non-empty `source.required_checks` |
| 4 | Two-party review | `source.review_policy: TWO_PARTY` |

Policy minimums by tier (skill policy, not SLSA text): LOW 1, MEDIUM 2, HIGH 3, CRITICAL 4. A lower level needs `risk.assurance.deviation_reason`. These are owner-declared platform settings; record `CONFIG_INSPECTION` evidence to show they are on.

## Build level 3

When `risk.assurance.slsa_build_level` is 3, `supply_chain.build_hardening` is required: `platform`, `isolated_builds: true`, `signing_keys_isolated: true`.

## `ai_profile`

Required whenever a component has `ai_capability: true` or an AGENT identity exists. One practice per key; see `ai-agent-controls.md` for what each covers. `prompt_confidentiality` must also carry `secrets_in_prompts: false`.

## `project.intake` (the project gate)

Answers to the questions in `SKILL.md` under "Project gate", recorded as:

```yaml
project:
  intake:
    constraint: {statement: "", evidence: ""}
    forces: {push: "", pull: "", anxiety: "", habit: ""}
    existing_assets: []
    bet: {belief: "", wager: "", expected_outcome: "", leading_indicator: ""}
    outcomes: []
    rejected_options: [{option: "", reason: ""}]
```

LOW requires `constraint.statement` only. MEDIUM and above require every field above. The intake is part of the design digest, so changing it after approval needs re-approval.
