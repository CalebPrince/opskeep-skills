---
name: opskeep-video-production-gate
description: Gate VidKre8 and other reference-led video productions before implementation and delivery. Use when a video, ad, promo, explainer, motion piece, recut, or scene recreation depends on reference videos, or when an existing production needs a fidelity and quality review. Requires evidence-backed analysis, reuse/extend/invent decisions, explicit creative-director approval, and scored render review; it does not itself render the video.
metadata:
  lane: gate
  version: "1.1.0"
---

# Opskeep Video Production Gate

Turn a video brief and its references into an approved, implementation-ready production contract. Prevent vague "inspired by" work, false claims that a reference was watched, and premature delivery.

Sequence: **Project Gate, when this is a new product or major site -> Video Production Gate -> agent-agnostic implementation -> Render Review -> delivery.** This gate owns the video's creative contract and quality bar. It does not authorize unrelated product work.

## Hard rules

1. Never claim a reference was watched, heard, measured, or analyzed unless the current run has verifiable access and records evidence. A URL, filename, thumbnail, transcript alone, or another agent's unsupported summary is not proof of audiovisual review.
2. If direct playback/frame/audio inspection is unavailable, set `reference_access` to `unverified` or `partial`, name exactly what was accessible, and stop before reference-fidelity approval. The user may approve a concept-only route, but it must not be described as reference-faithful.
3. No implementation starts until the creative director - the user or a person they explicitly name - approves the production plan. "Looks good," "continue," silence, or approval from an execution agent does not count.
4. Approval of the plan is not approval of the render. Every render must pass scored review or receive an explicit, recorded exception from the creative director.
5. Tool and model choices are implementation details. Specify observable outcomes, timing, assets, and acceptance criteria so any capable agent or editor can execute the plan.

## Files and state

Work in the production root. Store the gate in `.opskeep/video-production-gate/`:

- `state.json`: working state and evidence
- `production-plan.md`: approved creative contract
- `review-<version>.json`: per-render scores, evidence, issues, and decision
- `gate.json`: machine-readable approval state and hashes

Use `scripts/video_gate.py` to validate, approve, score, and verify. Read [references/state-schema.md](references/state-schema.md) before authoring state. Read [references/examples.md](references/examples.md) when the brief mixes existing work with new material or evidence access is unclear.

Copy [assets/video-production-checklist.md](assets/video-production-checklist.md) into the production workspace when the team needs a human-readable working checklist alongside the machine-checked gate state. The checklist assists the workflow; `state.json`, approvals, and direct render inspection remain authoritative.

## Workflow

### 0. Detect existing state

If `.opskeep/video-production-gate/gate.json` exists, run `python scripts/video_gate.py verify --root <production-root>`. If the approved plan is unchanged, continue only with the authorized phase. If inputs, analysis, plan, or render changed, reopen the affected stage; never narrate around drift.

### 1. Absorb the brief

Extract audience, objective, channel/aspect ratio, duration, CTA, supplied assets, restrictions, deliverables, and definition of success. Separate facts from assumptions. Do not ask for information already present.

### 2. Establish reference access and evidence

For each reference, record identity, duration when known, access method, and `verified`, `partial`, or `unverified` status. Evidence for `verified` analysis must include a timestamped scene table spanning the full relevant duration and at least two additional observable categories: transitions/camera, typography/layout, audio/beat, color/texture, or compositing/layers.

The scene table must state per segment: timestamps, visual content, composition, motion/transition behavior, type/copy treatment, audio/beat relationship, and production implication. Use honest uncertainty where frames or audio are ambiguous.

### 3. Define fidelity deliberately

Write a fidelity contract, not "make it similar":

- invariants: reference traits that must survive;
- adaptations: changes for brand, message, format, accessibility, or assets;
- exclusions: what must not be copied or claimed;
- measurable tolerances: duration, cut points, transition timing, layout, motion character, type scale, color, audio synchronization, and finish.

Avoid copying protected logos, characters, footage, music, or distinctive expressive elements without rights. Recreate technique and structure only to the extent authorized.

### 4. Decide reuse, extend, or invent

Classify every scene or production unit:

- `reuse`: retain an approved existing asset or sequence substantially as-is;
- `extend`: preserve its visual grammar while adapting or adding content;
- `invent`: create a new solution where no suitable approved material exists.

Prefer reuse, then extension, then invention when each serves the brief. "Combine and add new" is valid only when the plan names which parts use each mode and how continuity is maintained.

### 5. Produce the creative-director packet

Create `production-plan.md` using [references/production-plan-template.md](references/production-plan-template.md). Include the timestamped analysis, fidelity contract, scene matrix, storyboard/shot plan, timing and audio plan, asset provenance, execution-neutral acceptance criteria, risks, assumptions, and rejected directions.

Run `python scripts/video_gate.py validate --root <production-root>` and fix every error.

### 6. Obtain plan approval

Only explicit language such as "Approve Video Production Gate" or an unambiguous approval of the named plan version passes this stage. Record the approver's exact quote:

```text
python scripts/video_gate.py approve-plan --root <production-root> --quote "<exact approval>"
```

If changes are requested, update the version, invalidate prior approval, revalidate, and ask again. Only after approval may an implementation agent execute the plan.

### 7. Review every render

Inspect the actual rendered file, not only source, stills, or an agent report. Record timestamped observations and score 0-100:

| Dimension | Weight |
|---|---:|
| Reference fidelity | 30% |
| Motion | 25% |
| Composition | 20% |
| Pacing | 15% |
| Polish | 10% |

Use [references/review-rubric.md](references/review-rubric.md), then run `python scripts/video_gate.py score --root <production-root> --review <review.json>`.

Default thresholds:

- `90-100`: `APPROVAL_READY`
- `80-89.99`: `REVISE_MINOR`
- `65-79.99`: `REVISE_MAJOR`
- below `65`: `REJECTED`

Regardless of total, a render cannot be approval-ready if fidelity is below 85, any other dimension is below 75, evidence is missing, or a blocking defect exists. With no verified reference, mark fidelity `not_scorable`; the render may be approved only as original/concept-led work, never as reference-faithful.

### 8. Iterate and close

For each failed review, return a prioritized change list with timestamps, owner-neutral instructions, and expected score impact. Preserve review history. Re-render, inspect, and rescore. Stop when `APPROVAL_READY`, or when the creative director explicitly accepts a named exception with affected criterion and risk recorded.

Final state is `APPROVED_FOR_DELIVERY` only after explicit approval of the named render:

```text
python scripts/video_gate.py approve-render --root <production-root> --review <review.json> --quote "<exact approval>"
python scripts/video_gate.py verify --root <production-root>
```

## Approval states

`DRAFT` -> `AWAITING_CREATIVE_APPROVAL` -> `PLAN_APPROVED` -> `IN_PRODUCTION` -> `IN_REVIEW` -> `REVISION_REQUIRED` or `APPROVAL_READY` -> `APPROVED_FOR_DELIVERY`.

Only the creative director can move into `PLAN_APPROVED` or `APPROVED_FOR_DELIVERY`. Execution agents may recommend a state, never self-approve.

## Handoff

Report current state, plan version, reference-access status, score and blockers, approval evidence, and exact next action. Never say "matched the reference" without citing the stored timestamped analysis and passing fidelity score.
