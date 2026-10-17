# Running the design workshop

The workshop is an interactive page, not a questionnaire. Controls are visual cards, chips, sliders and dials; a live studio shows a wireframe that changes with every choice and a feed of "what I'm learning". Your job is to prepare it well and interpret what comes back.

## Preparing it

1. List what the brief already answers. Map to control ids in `workshop_bank.json`. The first section is the problem and the bet: `s_constraint`, `s_evidence`, `s_push`, `s_pull`, `s_anxiety`, `s_habit`, `s_existing`, `s_belief`, `s_wager`, `s_outcome`, `s_indicator`. Keep `s_constraint`, `s_belief`, `s_wager`, `s_outcome` and `s_indicator` unless the brief states them outright. The rest of the controls:
   `p_type`, `p_platform`, `p_stage`, `u_frequency`, `u_activity`, `u_skill`, `u_context`, `x_feel`, `x_tone` (dials `d_playful`, `d_expressive`, `d_spacious`, `d_distinct`), `x_stakes`, `x_mobile` (only when platform is both), `x_content` (only websites/stores), `x_access`, `x_brand`, `v_direction`, `v_nav`, `v_surface`, `v_shape` (`d_soft`), `v_theme`, `v_accent`, `v_notes`, plus `p_name`, `p_summary`.
2. Facts stated outright: drop the control (`--drop`). Facts you are fairly sure of but want confirmed: put them in `prefill.json` as `{"u_frequency": "allday", "u_activity": ["managing"]}`; the user sees them selected and can change them. Dials take numbers 0-100.
3. Keep at least the taste controls (`v_direction`, `x_tone`, `v_surface`) unless the user already showed references. Taste is the one thing you cannot infer.
4. Conditional controls (`show_if`) appear or disappear on their own; leave them in.

A typical run has 8-14 visible controls and takes a few minutes. If the user gave a rich brief, fewer.

## Reading the answers

`answers` maps control id to a value: a string, an array (chips), or a number 0-100 (dials, only if touched). `unsure` lists controls the user handed to you. Absent means not answered.

Interpretation table (use as a starting point, apply judgement):

| Signal | Implies |
|---|---|
| `u_frequency` daily/allday | persistent navigation, keyboard shortcuts, dense lists, fast repeated actions |
| `u_frequency` occasional | self-explanatory screens, guidance, generous spacing |
| `u_activity` managing/searching | table-first, filters, saved views, detail drawer |
| `u_activity` monitoring | glanceable status, alerts, freshness indicators |
| `u_activity` creating | editor patterns, autosave, undo, strong empty states |
| `u_activity` reading | typographic quality, comfortable measure, low chrome |
| `u_skill` expert / novice | shortcuts and density / onboarding and plain language |
| `u_context` lowband | lean pages, skeletons, retryable requests |
| `u_context` moving/field | large touch targets, high contrast, quick actions |
| `x_stakes` high / low | confirmations and audit trail / undo over confirmation |
| `p_platform` desktop / phone, native | desktop-first / mobile-first |
| `x_mobile` quick / monitor / full | reduced task view / read-only / full parity |
| `d_spacious` low / high | dense / airy |
| `d_distinct` high / low | custom identity, more effort / borrow known conventions |
| `d_playful`, `d_expressive` | copy tone, shape language, motion budget |
| `x_access` | additions on top of the WCAG 2.2 AA baseline, which always applies |

Turn each meaningful implication into a decision. Explicit answers become `CONFIRMED` with `confirmed_via: "interview"`. Implications you derived become `INFERRED` (with the source in `rationale`). Unsure controls become `PROPOSED` with your recommendation, or `NEEDS_INPUT` with options when the choice is genuinely the user's (mobile scope, dashboard structure are typical).

## Strategy answers

| Answer | Goes to |
|---|---|
| `s_constraint`, `s_evidence` | `strategy.constraint.statement`, `.evidence` (if the user wrote a solution, restate it as the constraint behind it and confirm) |
| `s_push`, `s_pull`, `s_anxiety`, `s_habit` | `strategy.forces`; anxiety also becomes a risk or assumption for the security gate |
| `s_existing` | `strategy.existing_assets` (split on line breaks or semicolons; "none" becomes `["none"]`) |
| `s_belief`, `s_wager`, `s_outcome`, `s_indicator` | `strategy.bet.belief`, `.wager`, `.expected_outcome`, `.leading_indicator` |
| outcome text | `strategy.outcomes`: split into outcomes and rewrite any activity ("add a form") into a result ("enquiries are captured") |

An unanswered optional field stays blank and appears as a warning, not a guess. Never invent evidence.

## Do not

- Ask in chat what the workshop or the brief already covers.
- Ask "what colours do you want?" style questions. The workshop shows options; you infer the rest.
- Treat a prefilled control the user left alone as a strong signal; it is a confirmed guess at best, so keep the resulting decision `INFERRED` unless they touched it.
