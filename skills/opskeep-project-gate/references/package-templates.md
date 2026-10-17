# Prose docs to author after approval

`gate.py apply` writes `decisions.yaml`, `tokens.json`, `PROJECT.md` (problem, bet and rejected paths first), `assumptions.md` and `intake.yaml` (the same answers in the shape the security gate's `project.intake` expects). You write the five below into `.opskeep/project-gate/`, then run `gate.py seal`. Each must be a real document (seal rejects files under 300 characters, or containing `TODO` or `{{`). State decisions as instructions to a coding agent. Cite decision IDs (`PG-005`) so changes trace back.

## DESIGN.md (source of truth)
Read first by any agent touching UI.
1. **Product in one paragraph**: what, for whom, the primary job.
2. **Direction**: chosen name, tagline, why it fits, what it deliberately is not.
3. **Foundation table**: theme, navigation, content width, density, radius, typography, primary interaction, mobile strategy, animation, icons.
4. **Rules**: 8-15 imperative rules an agent can check ("Lists are tables, never card grids", "One primary button per view", "No animation except state changes"). Each cites its decision ID.
5. **Do / don't** pairs for the three easiest mistakes in this direction.
6. **Tokens**: point to `tokens.json`; never restate values here.
7. **Change process**: "Do not edit these files by hand. Reopen the decision with `gate.py reopen`."

## screens.md
Screen inventory. For each screen: purpose, primary user job, main layout pattern, key components, states (empty, loading, error, populated), entry and exit points. Include the home/dashboard structure decision and navigation map.

## components.md
Components the direction needs, grouped (navigation, data display, forms, feedback, overlays). For each: when to use, variants, sizes, states, and the token names it uses. Flag the few components that carry the character (e.g. the data table for an operational tool).

## responsive.md
Breakpoints, how navigation adapts, what each screen becomes on small screens according to the mobile decision (full, quick actions, monitoring), touch target sizes, slow-network behaviour where relevant.

## accessibility.md
WCAG 2.2 AA baseline as testable rules: keyboard paths, focus style, contrast (reference the validated tokens), labels, error messaging, reduced motion, plus anything the user added (screen-reader priority, RTL, low vision). List what must be verified before release.
