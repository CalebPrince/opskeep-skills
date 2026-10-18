# Risk-proportional output modes

Use the smallest artifact that makes the risk inspectable. These are minimums, not ceilings. Control-domain coverage, assurance targets and supply-chain depth scale with the tier as shown below; the validator enforces them.

| | LOW / FAST_TRACK | MEDIUM / STANDARD | HIGH / FULL | CRITICAL / FULL |
|---|---|---|---|---|
| Required control domains | 7 (see `control-domains.md`) | 15 | 18 (all) | 18 (all) |
| ASVS level target (skill policy) | L1 | L2 | L2 | L3 |
| SLSA build level target (skill policy) | 1 | 1 | 2 | 3 |
| SBOM | decision recorded (may be N/A with reason) | decision recorded | required, with format | required, with format |
| Vulnerability gate severity | any value | not `NONE` | not `NONE` | not `NONE` |
| Remediation SLA, disclosure route, support policy | optional | required | required | required |
| `project.regulatory_context` | optional | non-empty | non-empty, no `NOT_ASSESSED` at approval | non-empty, no `NOT_ASSESSED` at approval |
| Project artifacts | collapsed set allowed (see `project-artifacts.md`) | all four | all four | all four |

`AI_AGENT` becomes required at any tier when a component has `ai_capability: true` or an `AGENT` identity exists. A lower assurance target is allowed only with a recorded `deviation_reason`, which the validator reports as a warning.

## LOW / FAST_TRACK

Create a compact one-page dashboard with: overview and lock state; simple architecture/trust-boundary diagram; data/identity summary; top credible threats and essential controls; required gates; open decisions and approval. The blueprint may be concise. Populate the canonical YAML, using empty lists and reasoned `NOT_APPLICABLE` entries rather than omitting contract fields.

Typical minimum analysis: internet exposure, contact or analytics data, secrets, deployment identity, input validation, dependency/secret scanning, logging hygiene, secure defaults, rollback, and retention/deletion. Seven required domains is the point: most can be a one-line control or a one-line reasoned `NOT_APPLICABLE`.

## MEDIUM / STANDARD

Create these dashboard sections: overview; architecture and boundaries; data flows; identity/access; threats and controls; gates/supply chain; monitoring/recovery; open decisions/approval. Include an identity-permission matrix and trace threats to controls and evidence requirements. Add the regulatory-context summary and the supply-chain decisions (SBOM, provenance, remediation SLA).

## HIGH or CRITICAL / FULL

Create the full dashboard:

1. Overview and approval/lock state
2. Architecture, providers, exposure, and trust boundaries
3. Classified data flows, storage, retention, and deletion
4. Human, service, and agent identity/authorization matrix
5. AI/agent tools, gateways, data, and human gates (the AG-01 to AG-12 answers), or reasoned N/A
6. Threat model with likelihood, impact, mitigation, residual risk, owner, and status
7. Controls across all 18 domains, with standards `refs`
8. Gates with stage, blocking behavior, owner, and evidence
9. Supply chain: dependency policy, SBOM format, provenance/signing target and SLSA level, vulnerability management, from the `supply_chain` block
10. Monitoring signals and ownership
11. Incident response, isolation, revocation, backup, restore, and rollback
12. Regulatory context, assurance targets, open decisions, and approval blockers

For CRITICAL, require independent review where available and explicitly record separation-of-duties decisions, emergency access, recovery objectives, and evidence freshness.

## SPIKE / PROTOTYPE overlay

Keep the artifact short unless underlying risk requires more. It must show: learning goal, expiry date, sandbox boundary, synthetic/non-production data rule, credential restrictions, network/tool restrictions, destruction/cleanup owner, likely production tier, and `PRODUCTION_PROHIBITED` gate. In the YAML set `mode: SPIKE`, `likely_production_tier`, `lifecycle.spike_expires_at`, `development_lock: SANDBOX_ONLY`, `deployment_lock: LOCKED`, and an `approval.scope` naming only `sandbox`/`development`. Approval may authorize only the bounded experiment; it cannot authorize production use. An expired spike fails validation. Domain minimums are not enforced for a spike, but the likely production tier's minimums apply before promotion.
