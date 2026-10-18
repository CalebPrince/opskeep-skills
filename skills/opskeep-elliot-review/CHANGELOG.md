# Changelog

## 1.1.1
- Baseline drift also checks schema 2.3 `source`, `engineering` and `ai_profile` declarations. Crosswalk updated to the design skill's 2.4.0 version.

## 1.1.0 — standards-aware, machine-checked deliverables
- Findings now carry standards `refs` (ids from `references/standards-crosswalk.yaml`: OWASP Top 10:2025, OWASP LLM Top 10 2025, OWASP Agentic Top 10 2026, NIST SSDF 1.1, SLSA 1.2, CISA Secure by Design, ASVS 5.0 chapters V1-V17). The crosswalk is a byte-identical copy of the design skill's file; a test enforces that.
- New review area `AI_AGENT` (prompt injection, tools, output handling, code execution, memory/retrieval, limits, provenance, agent instruction files) and expanded areas for access-control failures (SSRF, redirects), error and exception handling, integrity/provenance, and secure defaults.
- Eleven named coverage areas replace free-form coverage rows so dashboard and report can be compared mechanically.
- Optional scanner-assisted mode (off by default): named, user-approved, read-only scanners on a scratch copy, results labeled with the tool, never proof of safety.
- Remote and attached repositories: how to obtain a read-only copy and record the commit SHA.
- Delivery rules: outputs go to the session's output or scratch directory outside the repository, are sent to the user, and are not published as hosted pages unless asked.
- Baseline drift supports schema 2.1 and 2.2 and ends with "Proposed baseline updates" (suggested `CHG-*` and evidence entries) instead of silent edits.
- New `scripts/lint_deliverables.py` (+ 19 tests): no external resources or network-capable script in the dashboard, no secrets, no security score, finding ids/severities/counts/refs/coverage/posture agree across both files, OBSERVED findings have repository-relative `path:line` evidence, optional `--repo` check that files and lines exist.
- The skill's own scripts are explicitly allowed to run; repository code still is not.

## 1.0.0
- Initial read-only repository security assessment with dashboard and report.
