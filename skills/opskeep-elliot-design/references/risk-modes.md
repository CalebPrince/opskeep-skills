# Risk-proportional output modes

Use the smallest artifact that makes the risk inspectable. These are minimums, not ceilings.

## LOW / FAST_TRACK

Create a compact one-page dashboard with: overview and lock state; simple architecture/trust-boundary diagram; data/identity summary; top credible threats and essential controls; required gates; open decisions and approval. The blueprint may be concise. Populate the canonical YAML, using empty lists and reasoned `NOT_APPLICABLE` entries rather than omitting contract fields.

Typical minimum analysis: internet exposure, contact or analytics data, secrets, deployment identity, input validation, dependency/secret scanning, logging hygiene, rollback, and retention/deletion.

## MEDIUM / STANDARD

Create these dashboard sections: overview; architecture and boundaries; data flows; identity/access; threats and controls; gates/supply chain; monitoring/recovery; open decisions/approval. Include an identity-permission matrix and trace threats to controls and evidence requirements.

## HIGH or CRITICAL / FULL

Create the full dashboard:

1. Overview and approval/lock state
2. Architecture, providers, exposure, and trust boundaries
3. Classified data flows, storage, retention, and deletion
4. Human, service, and agent identity/authorization matrix
5. AI/agent tools, gateways, data, and human gates, or reasoned N/A
6. Threat model with likelihood, impact, mitigation, residual risk, owner, and status
7. Controls across auth, authorization, secrets, data, API, AI, supply chain, logging, deployment, recovery, and incident response
8. Gates with stage, blocking behavior, owner, and evidence
9. Supply-chain inventory, provenance, SBOM needs, and monitoring
10. Monitoring signals and ownership
11. Incident response, isolation, revocation, backup, restore, and rollback
12. Open decisions and approval blockers

For CRITICAL, require independent review where available and explicitly record separation-of-duties decisions, emergency access, recovery objectives, and evidence freshness.

## SPIKE / PROTOTYPE overlay

Keep the artifact short unless underlying risk requires more. It must show: learning goal, expiry date, sandbox boundary, synthetic/non-production data rule, credential restrictions, network/tool restrictions, destruction/cleanup owner, likely production tier, and `PRODUCTION_PROHIBITED` gate. In the YAML set `mode: SPIKE`, `likely_production_tier`, `lifecycle.spike_expires_at`, `development_lock: SANDBOX_ONLY`, and `deployment_lock: LOCKED`. Approval may authorize only the bounded experiment; it cannot authorize production use.
