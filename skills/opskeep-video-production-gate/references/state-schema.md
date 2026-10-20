# State schema

`state.json` is the working record. Use this minimum shape:

```json
{
  "schema_version": 1,
  "production_id": "vidkre8-launch-ad",
  "plan_version": "1.0",
  "status": "AWAITING_CREATIVE_APPROVAL",
  "creative_director": {"name": "User", "authority": "owner"},
  "brief": {"objective": "", "audience": "", "channel": "", "aspect_ratio": "9:16", "target_duration_seconds": 30, "cta": "", "deliverables": ["master MP4"]},
  "references": [{
    "id": "REF-01", "source": "reference.mp4", "reference_access": "verified",
    "access_evidence": "Direct audiovisual inspection in current run", "duration_seconds": 30,
    "scenes": [{"start": "00:00.000", "end": "00:03.200", "visual": "", "composition": "", "motion_transition": "", "type_copy": "", "audio_beat": "", "production_implication": ""}],
    "observed_categories": ["transitions_camera", "typography_layout", "audio_beat"]
  }],
  "fidelity_contract": {"invariants": [], "adaptations": [], "exclusions": [], "tolerances": []},
  "scene_plan": [{"id": "SC-01", "time": "00:00.000-00:03.200", "decision": "extend", "source": "REF-01 scene 1", "direction": "", "acceptance": []}],
  "assets": [{"id": "A-01", "source": "", "rights": "owned|licensed|unknown", "use": ""}],
  "risks": [], "assumptions": [], "rejected_directions": [], "approval": null
}
```

Rules:

- `reference_access` is `verified`, `partial`, or `unverified`.
- A verified reference has a nonempty chronological scene table covering its relevant duration without unexplained gaps, plus at least two observed categories.
- Every scene plan item uses `reuse`, `extend`, or `invent`.
- `source` is required for reuse and extend. Invented scenes explain why invention is needed.
- Approval stores type, plan version, quote, approver, timestamp, and plan hash.
- Changing the plan version or hashed plan invalidates approval.
