# Security

Status: REVIEW_REQUIRED  
Baseline version: 0.1.0  
Canonical record: `security-baseline.yaml`  
Owner: TBD  
Last reviewed: YYYY-MM-DD

This file is the human-readable view. `security-baseline.yaml` is authoritative for approval, scope, locks, controls, gates, and evidence. Do not claim approval or verification here unless the canonical record and linked evidence support it.

## Posture and scope

State risk tier/mode, environments, in-scope assets and identities, data classifications, production posture, development/deployment locks, and explicit exclusions.

## Assurance targets and standards

Record the targets from `risk.assurance` (ASVS level, SLSA build level) and why. List the standards each control family maps to using the `refs` in the baseline (OWASP Top 10:2025, OWASP LLM and Agentic lists when AI is present, SSDF, SLSA, CISA Secure by Design, ASVS). Name any control domain marked `NOT_APPLICABLE` with its reason. Do not claim conformance to a standard; claim only what evidence shows.

## Supply chain and vulnerability management

Summarize the dependency policy (lockfile, vulnerability gate severity, update automation), SBOM decision, build provenance and signing target, remediation timeline, support policy, and how to report a vulnerability. Mirror `supply_chain` in the baseline.

## Regulatory context

List each applicable or assessed regime from `project.regulatory_context` with status and the controls that address it. State `NOT_ASSESSED` plainly where that is still true.

## Baseline controls

| Control ID | Requirement | Owner | Status | Evidence ID/location | Limitation or next step |
|---|---|---|---|---|---|
| CTL-001 | Example only—replace with project fact | TBD | REQUIRED | EVD-001 / NOT_YET_BUILT | Define implementation |

## Identity, data, and boundaries

Summarize authentication, authorization, least privilege, secrets, sensitive flows, retention/deletion, encryption, logging redaction, tenant separation, and third-party boundaries. Link the detailed architecture and baseline records.

## Gates and evidence

List pre-implementation, pull-request, build, pre-deploy, deploy, and runtime gates with their owners, blocking behavior, and current evidence. Keep proposed/configured/verified distinct.

## Known risks and open decisions

List approval blockers, accepted risks with owner/reason, deferred decisions, expiry, and compensating controls.

## Reporting and response

Document the private security-reporting route, triage owner, incident contacts, containment/revocation path, recovery/restore expectations, and evidence retention. Never publish secrets or sensitive exploit details here.
