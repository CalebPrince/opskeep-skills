# Dashboard and report specification

Generate two consistent artifacts: a self-contained HTML dashboard and a Markdown report. Prefer clarity and evidence density over decorative security imagery.

## Dashboard content

### Header

Show repository name, absolute reviewed path, branch/commit when available, assessment time, depth, working-tree state, and explicit static-review limitations.

### Posture strip

Show the plain-language posture and finding counts by severity. Do not calculate or imply a security score.

### Top risks

Show up to five highest-priority findings with severity, confidence, affected asset, concise impact, and evidence link.

### Repository map

Show the observed stack, major components, exposure, data stores, integrations, identities, and trust boundaries. Clearly mark inferred items.

### Coverage

For each review area use one of:

- `REVIEWED`
- `PARTIAL`
- `NOT_ASSESSED`
- `NOT_APPLICABLE`

Include the reason for partial or missing coverage. Coverage is not a quality score.

### Findings ledger

Allow visual scanning or filtering by severity, category, state, and confidence. Each finding must include:

- Stable local ID such as `ER-AUTH-001`
- Title
- Severity and confidence
- `OBSERVED` or `INFERRED`
- Affected component or asset
- Repository-relative file and one-based line
- Minimal redacted evidence
- Impact and plausible attack path
- Recommendation and verification step

### Baseline alignment

When a baseline exists, summarize `ALIGNED`, `DRIFT`, `UNPROVEN`, and reasoned `NOT_APPLICABLE` records. When none exists, say so without treating absence alone as a vulnerability.

### Recommendations

Organize work into `Now`, `Next`, and `Later`. Show which findings each action addresses, its expected risk reduction, effort (`SMALL`, `MEDIUM`, `LARGE`), owner when known, and verification step.

### Limitations

List what was not inspected or executed, unavailable context, excluded paths, size/time limits, and the difference between static evidence and runtime verification.

## Visual rules

- Self-contained HTML: inline CSS and, only when needed, minimal inline JavaScript.
- No external fonts, CDNs, trackers, analytics, or network requests.
- Responsive and keyboard-readable, with visible focus and sufficient contrast.
- Use color as a secondary severity cue; always include text labels.
- Prefer compact evidence tables, relationship diagrams made with HTML/CSS, and restrained motion.
- Do not embed repository file contents beyond minimal redacted excerpts.

## Markdown report order

1. Executive assessment
2. Scope and repository identity
3. Architecture and trust boundaries
4. Coverage and methodology
5. Findings, ordered by severity and priority
6. Baseline alignment, when applicable
7. Recommendations: Now / Next / Later
8. Positive observed controls
9. Limitations and unverified assumptions

