# Decision model and state.json

Copy the shape of `example-state.json`. `gate.py validate` enforces everything below.

## The `strategy` block (required)

```
"strategy": {
  "constraint": {"statement": "...", "evidence": "..."},
  "forces": {"push": "...", "pull": "...", "anxiety": "...", "habit": "..."},
  "existing_assets": ["..."],
  "bet": {"belief": "...", "wager": "...", "expected_outcome": "...", "leading_indicator": "..."},
  "outcomes": ["..."]
}
```

`validate` errors when the constraint statement, existing assets, any part of the bet or the outcomes are missing, and warns about missing evidence or forces and outcomes that read like activities. Mirror the constraint and the bet as decisions in area `strategy` so the user can confirm or change them on the dashboard; the values must match. Rejected paths are not stored separately: every direction that is not selected is written to `intake.yaml` with its `why_not` (or, if absent, its `tradeoffs`).

## Decision states

| State | Meaning | Blocks approval |
|---|---|---|
| CONFIRMED | The user said or explicitly confirmed it | no |
| INFERRED | You derived it from other answers | no (confirmed by gate approval, and flagged in `assumptions.md`) |
| PROPOSED | You suggest it; the user has not weighed in | no (same as inferred) |
| NEEDS_INPUT | Genuinely the user's call; give `options` and a `question` | **yes** |
| REJECTED | The user refused it and it needs replacing | **yes** |
| SUPERSEDED | Replaced by a newer decision | no (kept for history) |

Readiness % = (confirmed x1 + inferred x0.75 + proposed x0.5) / active decisions. It is a progress cue, not an approval rule.

Approval is blocked only by: any NEEDS_INPUT, any REJECTED, any unresolved conflict, no selected direction, or an invalid state. The dashboard tells the user how many inferred or proposed decisions approval will confirm, and `gate.json` records how many were confirmed explicitly versus by gate approval.

## Decision fields

```
id          PG-001 ... (unique, never reused)
area        strategy | project | users | ux | screens | visual | responsive | accessibility
title       short noun phrase
value       what is decided, in plain words (absent only for NEEDS_INPUT)
status      see above
confirmed_via   interview | explicit | gate_approval   (CONFIRMED only)
rationale   one line: why
depends_on  [ids]  decisions this one only makes sense under
options     [{value,label,hint}]  for NEEDS_INPUT
question    the question shown for NEEDS_INPUT
```

`depends_on` is what makes change detection precise: PG-002 "Persistent sidebar" depends on PG-001 "Desktop-first". Reopening PG-001 reopens PG-002 but not "Table-first lead management". Be honest about dependencies; over-declaring reopens too much, under-declaring leaves stale decisions.

Never edit or reuse an ID. To change a decision after the user rejects it, mark the old one `SUPERSEDED` and add a new ID.

## Conflicts

`conflicts: [{"a":"PG-001","b":"PG-009","text":"Desktop-first vs mobile-first"}]`. A conflict counts while both sides are live (not rejected or superseded) and blocks approval.

## Directions (2 or 3)

Genuinely different answers to the same brief, not three skins. Each needs:
- `id`, `name`, `tagline`, `fit` (why it suits *this* project), `tradeoffs` (honest cost)
- `preview`: `{nav: sidebar|top|tabs|none, density: 1-3, radius, surface: flat|elevated|open, serif?, mono?, palette:{bg,surface,accent,ink,line}}` drives the wireframe
- `foundation`: label to value map shown to the user: Theme, Navigation, Content width, Density, Corner radius, Typography, Primary interaction, Mobile strategy, Animation, Icons
- `tokens`: `color` (bg, surface, border, text, muted, primary, primary_contrast, success, warning, danger; optional `color_dark`), `radius` {sm,md,lg}, `font` {sans,mono}, `space` {unit}, `density`. Text, muted and primary_contrast pairs must reach 4.5:1 contrast or `validate` fails. Pick colours that pass rather than loosening the rule.

Lead with the direction you recommend and say why in the chat message that accompanies the dashboard.

## Character bars

`character: [{trait, score 0-100}]`, three to five traits from the answers (e.g. Operational, Professional, Minimal, Expressive). They summarise the product's personality at a glance; they are not a decision.

## Risks and assumptions

Risks: things likely to bite (`severity` low|med|high). Assumptions: things you assumed without asking. Both appear on the dashboard and in `assumptions.md`.
