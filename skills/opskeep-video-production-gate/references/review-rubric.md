# Render review rubric

Score from direct inspection of the exported render. Every issue includes timestamp, observation, required correction, severity (`blocking`, `major`, `minor`), and dimension.

- **Reference fidelity — 30%:** approved invariants, scene grammar, timing relationships, transitions, type, audio, and permitted adaptations. If the reference was not verifiably inspected, use `not_scorable`.
- **Motion — 25%:** intentionality, easing, spatial continuity, hierarchy, physical coherence, transition execution, jitter, dead movement, and template-like effects.
- **Composition — 20%:** hierarchy, balance, framing, typography, safe areas, contrast, consistency, readability, and aspect ratio.
- **Pacing — 15%:** shot duration, rhythm, information load, beat sync, breathing room, hook speed, and CTA dwell.
- **Polish — 10%:** edges, masks, color, audio finish, export quality, spelling, alignment, continuity, placeholders, and artifacts.

Review JSON:

```json
{
  "review_version": "render-v03",
  "render_path": "exports/render-v03.mp4",
  "inspected_directly": true,
  "reference_access": "verified",
  "scores": {"reference_fidelity": 91, "motion": 88, "composition": 92, "pacing": 86, "polish": 90},
  "observations": [{"timestamp": "00:11.400", "dimension": "motion", "severity": "minor", "observation": "Card overshoots beyond the approved restrained motion language.", "required_change": "Reduce overshoot and settle within 300 ms."}],
  "blocking_defects": [],
  "exception": null
}
```

A score without timestamped observations is weak evidence. Add at least one positive or negative observation for each scored dimension.
