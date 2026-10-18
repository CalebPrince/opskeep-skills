# Dashboard and report specification

Generate two consistent artifacts: a self-contained HTML dashboard and a Markdown report. Prefer clarity and evidence density over decorative security imagery. The markers below are machine-checked by `scripts/lint_deliverables.py`; a deliverable that omits them fails the lint.

## Machine-checked markers

Dashboard (HTML attributes):

| Element | Attributes |
|---|---|
| Posture text | `data-posture` on the element whose text is one of `Immediate action`, `Needs attention`, `Manageable gaps`, `No major static signals found` |
| Severity count | `data-count="CRITICAL"` (also `HIGH`, `MEDIUM`, `LOW`, `INFO`) on an element whose text is the integer count |
| Finding row | `data-finding="ER-AUTH-001"` `data-severity` `data-confidence` `data-state` (`OBSERVED`/`INFERRED`) and optional `data-refs="OWASP-T10-2025:A01 ..."` |
| Coverage row | `data-area="IDENTITY_AUTHZ"` `data-coverage="REVIEWED"` (one row per area below) |
| Limitations | an element with `data-section="limitations"` |

Report (Markdown):

```
Posture: Needs attention
Counts: CRITICAL=0 HIGH=2 MEDIUM=1 LOW=0 INFO=3

| Area | Coverage | Reason |
|---|---|---|
| IDENTITY_AUTHZ | PARTIAL | Admin routes reviewed; tenant model not found |

### ER-AUTH-001 — Missing authorization on export
Severity: HIGH · Confidence: HIGH · State: OBSERVED
Refs: OWASP-T10-2025:A01
Evidence: src/admin/export.ts:42
```

Coverage areas (all eleven must appear in both files): `ORIENTATION`, `ARCHITECTURE`, `IDENTITY_AUTHZ`, `DATA_SECRETS`, `INPUT_API_ABUSE`, `DEPENDENCIES_BUILD`, `DELIVERY_INFRA`, `LOGGING_RECOVERY`, `TESTS_EVIDENCE`, `AI_AGENT`, `BASELINE_DRIFT`. Values: `REVIEWED`, `PARTIAL`, `NOT_ASSESSED`, `NOT_APPLICABLE`; anything other than `REVIEWED` needs a reason in the report.

Finding ids are `ER-<AREA>-<NNN>`. Evidence is repository-relative `path:line` with a one-based line; with `--repo` the lint checks the file exists and the line is within it.

## Dashboard content

### Header

Show repository name, absolute reviewed path, branch/commit when available, assessment time, depth, working-tree state, tools run (scanner-assisted mode) or "no tools run", and explicit static-review limitations.

### Posture strip

Show the plain-language posture and finding counts by severity. Do not calculate or imply a security score, grade or percentage.

### Top risks

Show up to five highest-priority findings with severity, confidence, affected asset, concise impact, and evidence link.

### Repository map

Show the observed stack, major components, exposure, data stores, integrations, identities, AI/agent components, and trust boundaries. Clearly mark inferred items.

### Coverage

One row per coverage area using `REVIEWED`, `PARTIAL`, `NOT_ASSESSED` or `NOT_APPLICABLE`, with the reason for anything other than `REVIEWED`. Coverage is not a quality score.

### Findings ledger

Allow visual scanning or filtering by severity, category, state, and confidence. Each finding must include:

- Stable local ID such as `ER-AUTH-001`
- Title
- Severity and confidence
- `OBSERVED` or `INFERRED` (and the scanner name when a scanner produced it)
- Affected component or asset
- Repository-relative file and one-based line
- Minimal redacted evidence
- Impact and plausible attack path
- Standards `refs` where one fits
- Recommendation and verification step

### Standards view

A compact table of finding counts by standard topic (for example by OWASP Top 10:2025 category, plus LLM/Agentic ids when the AI area applies), taken from the findings' `refs`. State that it shows where findings fall, not conformance, and that the crosswalk's `verified_on` date and any standards whose basis is not PRIMARY are noted in the limitations.

### Baseline alignment

When a baseline exists, summarize `ALIGNED`, `DRIFT`, `UNPROVEN`, and reasoned `NOT_APPLICABLE` records and list the proposed baseline updates. When none exists, say so without treating absence alone as a vulnerability.

### Recommendations

Organize work into `Now`, `Next`, and `Later`. Show which findings each action addresses, its expected risk reduction, effort (`SMALL`, `MEDIUM`, `LARGE`), owner when known, and verification step.

### Limitations

List what was not inspected or executed, unavailable context, excluded paths, size/time limits, tools that were or were not run, the crosswalk date, and the difference between static evidence and runtime verification.

## Visual rules

- Self-contained HTML: inline CSS and, only when needed, minimal inline JavaScript with no network APIs.
- No external fonts, CDNs, trackers, analytics, or network requests; no remote `url()` or `@import`.
- Responsive and keyboard-readable, with visible focus and sufficient contrast.
- Use color as a secondary severity cue; always include text labels.
- Prefer compact evidence tables, relationship diagrams made with HTML/CSS, and restrained motion.
- Do not embed repository file contents beyond minimal redacted excerpts.

## Markdown report order

1. Executive assessment (with `Posture:` and `Counts:` lines)
2. Scope and repository identity
3. Architecture and trust boundaries
4. Coverage and methodology (the coverage table above; tools run)
5. Findings, ordered by severity and priority
6. Standards view
7. Baseline alignment and proposed baseline updates, when applicable
8. Recommendations: Now / Next / Later
9. Positive observed controls
10. Limitations and unverified assumptions
