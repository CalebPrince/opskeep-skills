---
name: opskeep-project-gate
description: Opskeep-project-gate is the first gate before any new project is built. It starts from the problem (the constraint, the people's push, pull, anxiety and habit, what already exists, the bet and the outcomes), then runs an interactive design workshop (visual cards, sliders, a live preview that reshapes as the user chooses, not a quiz) and turns the answers into product and design decisions, 2-3 design directions, and an approval dashboard. Nothing is built until the user explicitly approves. Use this whenever the user starts, kicks off, scaffolds or plans a new app, website, dashboard, SaaS, mobile app, internal tool, store or major redesign, says "new project", "before we start", "design decisions", "project gate", "DESIGN.md", or asks Claude to just build something new with no approved design on record. Also use it when an approved gate exists and the user changes a foundational decision (for example "make it mobile-first" or "actually use a top nav"). Use it even if the user never says the word design.
metadata:
  lane: gate
  version: "1.1.0"
---

# Opskeep-project-gate

No project starts without understanding what should be built, who it is for, and the design decisions that govern it.

Sequence: **Project Gate → Opskeep/Elliot security gate (`opskeep-elliot-design`) → build.** This skill owns *what problem are we solving, what are we building, for whom, and how should it look and behave*. It does not own security (Elliot) or implementation.

**The hard rule:** approving the Project Gate authorises the *design direction*, never implementation. `implementation_authorized` is always `false` in `gate.json`; the security gate and the user decide when building starts.

## Start from the problem

Every gate begins with the problem and the bet, before any look-and-feel questions. The workshop's first section ("The problem") and the `strategy` block in `state.json` hold six answers, in this order:

1. **Constraint**: what is in the way of the outcome, and what shows it. "Build a client portal" is a solution; "clients cannot see invoice status without emailing us" is a constraint. Do not take the brief at face value. If no constraint can be named, say so and ask before going further.
2. **Forces on the people served**: push (current pain), pull (what the new thing offers), anxiety (what makes them hesitate; trust, cost, switching, data) and habit (the current way). Anxiety usually feeds the security gate.
3. **Existing assets**: what already works or already exists. More of what works, then better, and only then something new. `["none"]` is a valid answer.
4. **The bet**: "We believe <belief>, so we are betting <wager> that this produces <expected outcome>; we will watch <leading indicator>."
5. **Outcomes, not activities**: what changes for the business or the people, not what gets built.
6. **One recommendation, with rejected paths**: you recommend one direction and lead with it; every direction that is not selected is recorded with its honest cost in `intake.yaml`, so the owner is not handed an unweighted menu.

`gate.py validate` requires the constraint, existing assets, all four parts of the bet and at least one outcome, and warns when evidence or a force is missing or an outcome reads like an activity. Open the dashboard message with the constraint and what it costs, then present the directions as the relief.

## Why it works this way

The user wants a 15-minute workshop with an experienced product designer, not an exam. People can point at a layout far more accurately than they can describe one, so the interview is an interactive UI where choices reshape a live preview and a feed shows what each choice implies. Decisions are then tracked with explicit states so nothing the user never saw becomes binding, and one script (`gate.py`) is the only thing allowed to mark a gate approved, so approval cannot be faked by narration.

## Files

- `scripts/render.py` builds the two HTML UIs (`workshop`, `dashboard`). `scripts/gate.py` validates state, applies the user's response, writes the package, seals, verifies, reopens. `scripts/gatelib.py` is shared logic.
- `assets/workshop.html`, `assets/dashboard.html` (+ `common.css/js`) are the templates. Do not hand-write replacements; render them.
- `references/workshop_bank.json`: default controls and live-inference rules. `references/example-state.json`: a complete valid state to copy the shape from.
- `scripts/test_gate.py`: end-to-end checks (`python scripts/test_gate.py`).
- `references/interview-guide.md`: read before Step 2. `references/decision-model.md`: read before Step 3. `references/package-templates.md`: read before Step 7.

Work in the user's project root. The package lives in `.opskeep/project-gate/` (state at `.opskeep/project-gate/state.json`).

## Workflow

**0. Check for an existing gate.** If `.opskeep/project-gate/gate.json` exists run `python scripts/gate.py verify`. Approved and unchanged: tell the user the gate already passed and stop. Drifted or reopened: go to *Change detection*. If the user's request contradicts an approved decision, that is also change detection, not a fresh start.

**1. Absorb the brief.** Take everything already said (chat, files, repo) and note what it answers, starting with the problem: is a constraint, a bet or an outcome already stated? Rewrite a solution-shaped brief ("build a portal") as a candidate constraint and prefill it for the user to confirm. Do not ask what you can infer. An "internal accounting dashboard used eight hours a day by finance staff" already answers frequency, density, audience and stakes.

**2. Run the workshop.** Render the interactive workshop with only the controls still unknown, prefilling anything you inferred so the user can confirm it in one click:
```
python scripts/render.py workshop --project "<Name>" --drop <ids already known> --prefill prefill.json --out .opskeep/project-gate/ui/workshop.html
```
Show it to the user (see *Showing the UI*). They send back an answers JSON. If the brief was rich enough that nothing important is unknown, skip the workshop and go straight to the dashboard, since directions and decisions can be corrected there. Never dump a list of questions into chat instead.

**3. Interpret.** Turn answers into `state.json`: the `strategy` block (constraint, forces, existing assets, bet, outcomes; `s_*` answers map straight into it, `s_wager` days/weeks/months becomes "a few days", "a few weeks" or "months", and `s_indicator` values become a plain phrase), intent, product character, decisions with states (add `strategy`-area decisions "Constraint" and "The bet" so the user can confirm or change them on the dashboard; keep their values identical to the strategy block), 2-3 tailored design directions (each with tokens and a preview spec), risks, assumptions. Follow `references/decision-model.md`. Run `python scripts/gate.py validate`; fix every error (it checks IDs, dependencies, and that every palette meets WCAG AA contrast).

**4. Present the dashboard.**
```
python scripts/render.py dashboard --state .opskeep/project-gate/state.json --out .opskeep/project-gate/ui/dashboard.html
```
Show it. The user confirms, changes or rejects decisions, answers blocking ones, picks a direction, then chooses Approve Project Gate, Request Changes or Explore Alternative. The page returns a response JSON.

**5. Apply the response.** Save it to a file and run `python scripts/gate.py apply --response <file>`.
- `request_changes` / `explore_alternative`: revise state (mark replaced decisions `SUPERSEDED`, add new ones, add or adjust directions), validate, re-render, present again.
- `approve_project_gate`: the script refuses if anything is still `NEEDS_INPUT`, rejected, in conflict, or no direction is selected, or if the approval came from a stale render. On success it writes `decisions.yaml`, `tokens.json`, `PROJECT.md`, `assumptions.md`.

**6. Approval rule (strict).** Only two things pass the gate: the dashboard's Approve action processed by `gate.py apply`, or the user's own explicit words such as "Approve Project Gate" recorded with `gate.py approve-chat --quote "<their words>"`. None of these count: "looks good", "start", "continue", "go ahead", silence, finishing the workshop, the dashboard being generated, or picking a direction. If the user says one of those, say what is still needed and offer the Approve action. If blockers remain, name them; never approve around them.

**7. Author the prose docs, then seal.** Write `DESIGN.md`, `screens.md`, `components.md`, `responsive.md`, `accessibility.md` into the package directory from the confirmed decisions and chosen direction (`references/package-templates.md`). `DESIGN.md` is the source of truth that coding agents read before touching UI, so it must state decisions, not options. Then run `python scripts/gate.py seal`, which writes `gate.json` with file hashes (including `intake.yaml`). Until it seals there is no machine-readable proof the gate passed.

**8. Hand off.** Tell the user the gate passed, what direction was approved, that implementation is still not authorised, and that the next gate is Opskeep/Elliot security, which copies `intake.yaml` into `project.intake` of `security-baseline.yaml` instead of asking the same questions again. Downstream skills and coding agents should run `python scripts/gate.py verify` before touching the UI.

## Showing the UI

Both pages are self-contained HTML. Use what the session offers:
- Artifact tool available: publish the HTML file as a private artifact.
- File-delivery tool (`SendUserFile`): send the HTML with display `render`.
- Local desktop shell: open the file in the default browser.

Sandboxed viewers may block downloads or the clipboard, so every page also shows the response as selectable text with Copy and Download buttons. Ask the user to paste it back into the chat (or attach the downloaded `.json`). Save what they return to a file and feed it to `gate.py`. For the workshop answers, read the JSON directly: `answers` holds the choices, `unsure` lists controls the user handed to you.

## Conduct of the workshop and dashboard

- Speak like a good product designer: opinionated, brief, explaining the *why* of a suggestion. It should feel like a workshop, not an audit.
- Untouched dials and "you decide" mean the user delegates. Decide, mark the decision `PROPOSED`, and say so.
- Never ask a question whose answer follows from earlier ones.
- Every decision the user did not state is `INFERRED` or `PROPOSED`, never `CONFIRMED`. `CONFIRMED` needs `confirmed_via`: `interview` (they said it), `explicit` (they confirmed in the dashboard), `gate_approval` (set by the script on approval).

## Change detection

When the user contradicts an approved decision ("make it mobile-first"):
1. Find the affected decision IDs (`decisions.yaml` / `state.json`).
2. `python scripts/gate.py reopen --id PG-001 --reason "<their words>"`. This reopens that decision and only its transitive dependents (via `depends_on`), sets the gate to `reopened`, and marks `gate.json` not approved.
3. Re-render the dashboard, get the reopened decisions answered, apply, update only the affected prose docs, re-seal.
Do not rerun the whole workshop, and do not edit sealed files by hand: `verify` will report drift.

## What good output looks like

A dashboard that opens with the problem and the bet, where every decision has an ID, a plain-language value, a reason, and a state; 2-3 directions that are genuinely different and each fit the project; a foundation table (theme, navigation, density, radius, type, primary interaction, mobile strategy, animation, icons); and, after approval, a sealed package another agent can build from without asking the user anything again.
