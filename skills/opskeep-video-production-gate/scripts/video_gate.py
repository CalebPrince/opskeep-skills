#!/usr/bin/env python3
"""Deterministic state, approval, scoring, and integrity checks for the video gate."""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

WEIGHTS = {"reference_fidelity": .30, "motion": .25, "composition": .20, "pacing": .15, "polish": .10}
GATE_DIR = Path(".opskeep/video-production-gate")


def load_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def digest(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def paths(root: Path):
    base = root / GATE_DIR
    return base, base / "state.json", base / "production-plan.md", base / "gate.json"


def validation_errors(state, plan_path: Path):
    errors = []
    required = ["schema_version", "production_id", "plan_version", "status", "creative_director", "brief", "references", "fidelity_contract", "scene_plan"]
    errors += [f"missing field: {key}" for key in required if key not in state]
    if not plan_path.exists() or not plan_path.read_text(encoding="utf-8").strip():
        errors.append("production-plan.md is missing or empty")
    brief = state.get("brief", {})
    for key in ("objective", "audience", "channel", "aspect_ratio", "target_duration_seconds", "deliverables"):
        if not brief.get(key): errors.append(f"brief.{key} is required")
    refs = state.get("references", [])
    if not refs: errors.append("at least one reference record is required")
    for ref in refs:
        rid = ref.get("id", "reference")
        access = ref.get("reference_access")
        if access not in {"verified", "partial", "unverified"}: errors.append(f"{rid}: invalid reference_access")
        if not ref.get("access_evidence"): errors.append(f"{rid}: access_evidence is required")
        if access == "verified":
            scenes = ref.get("scenes", [])
            if not scenes: errors.append(f"{rid}: verified reference requires timestamped scenes")
            if len(set(ref.get("observed_categories", []))) < 2: errors.append(f"{rid}: verified reference requires at least two observed categories")
            for index, scene in enumerate(scenes, 1):
                for key in ("start", "end", "visual", "composition", "motion_transition", "type_copy", "audio_beat", "production_implication"):
                    if key not in scene or scene[key] == "": errors.append(f"{rid} scene {index}: {key} is required")
    contract = state.get("fidelity_contract", {})
    for key in ("invariants", "adaptations", "exclusions", "tolerances"):
        if not contract.get(key): errors.append(f"fidelity_contract.{key} must be nonempty")
    scene_plan = state.get("scene_plan", [])
    if not scene_plan: errors.append("scene_plan must be nonempty")
    for scene in scene_plan:
        sid, decision = scene.get("id", "scene"), scene.get("decision")
        if decision not in {"reuse", "extend", "invent"}: errors.append(f"{sid}: decision must be reuse, extend, or invent")
        if decision in {"reuse", "extend"} and not scene.get("source"): errors.append(f"{sid}: source required for {decision}")
        if decision == "invent" and not scene.get("reason"): errors.append(f"{sid}: reason required for invent")
        if not scene.get("acceptance"): errors.append(f"{sid}: acceptance criteria required")
    return errors


def validate(root: Path):
    _, state_path, plan_path, _ = paths(root)
    if not state_path.exists(): return ["state.json is missing"]
    return validation_errors(load_json(state_path), plan_path)


def require_valid(root: Path):
    errors = validate(root)
    if errors:
        for error in errors: print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)


def approval_quote_ok(quote: str):
    lowered = quote.lower()
    return "approv" in lowered and len(quote.strip()) >= 8


def approve_plan(root: Path, quote: str):
    require_valid(root)
    if not approval_quote_ok(quote): raise SystemExit("Approval quote must be explicit and contain approval language.")
    _, state_path, plan_path, gate_path = paths(root)
    state = load_json(state_path)
    now = datetime.now(timezone.utc).isoformat()
    state["status"] = "PLAN_APPROVED"
    state["approval"] = {"type": "plan", "plan_version": state["plan_version"], "quote": quote, "approved_by": state["creative_director"].get("name", "creative director"), "approved_at": now, "plan_sha256": digest(plan_path)}
    save_json(state_path, state)
    gate = {"schema_version": 1, "status": "PLAN_APPROVED", "production_id": state["production_id"], "plan_version": state["plan_version"], "state_sha256": digest(state_path), "plan_sha256": digest(plan_path), "render_approval": None}
    save_json(gate_path, gate)
    print("PLAN_APPROVED")


def score_review(review):
    if not review.get("inspected_directly"): return None, "REJECTED", ["render was not inspected directly"]
    scores = review.get("scores", {})
    blockers = list(review.get("blocking_defects", []))
    missing_observations = {key for key in WEIGHTS if not any(item.get("dimension") == key and item.get("timestamp") for item in review.get("observations", []))}
    if missing_observations: blockers.append("missing timestamped observations for: " + ", ".join(sorted(missing_observations)))
    if review.get("reference_access") != "verified" or scores.get("reference_fidelity") == "not_scorable":
        return None, "CONCEPT_ONLY_REVIEW", blockers + ["reference fidelity is not scorable"]
    for key in WEIGHTS:
        value = scores.get(key)
        if not isinstance(value, (int, float)) or not 0 <= value <= 100: blockers.append(f"{key} must be numeric from 0 to 100")
    if blockers: return None, "REJECTED", blockers
    total = sum(scores[key] * weight for key, weight in WEIGHTS.items())
    if scores["reference_fidelity"] < 85: status = "REVISE_MAJOR"
    elif any(scores[key] < 75 for key in WEIGHTS if key != "reference_fidelity"): status = "REVISE_MAJOR"
    elif total >= 90: status = "APPROVAL_READY"
    elif total >= 80: status = "REVISE_MINOR"
    elif total >= 65: status = "REVISE_MAJOR"
    else: status = "REJECTED"
    return round(total, 2), status, []


def score(root: Path, review_path: Path):
    review = load_json(review_path)
    total, status, blockers = score_review(review)
    review["weighted_total"] = total
    review["decision"] = status
    review["computed_at"] = datetime.now(timezone.utc).isoformat()
    if blockers: review["computed_blockers"] = blockers
    save_json(review_path, review)
    print(json.dumps({"weighted_total": total, "decision": status, "blockers": blockers}))
    return status


def approve_render(root: Path, review_path: Path, quote: str):
    if not approval_quote_ok(quote): raise SystemExit("Approval quote must be explicit and contain approval language.")
    base, state_path, plan_path, gate_path = paths(root)
    require_valid(root)
    review = load_json(review_path)
    total, status, blockers = score_review(review)
    exception = review.get("exception")
    if status != "APPROVAL_READY" and not (exception and exception.get("quote") and exception.get("criterion") and exception.get("risk")):
        raise SystemExit(f"Render is {status}; approval requires APPROVAL_READY or a complete creative-director exception.")
    state, gate = load_json(state_path), load_json(gate_path)
    if gate.get("plan_sha256") != digest(plan_path): raise SystemExit("Approved plan has drifted; re-approve the plan.")
    state["status"] = "APPROVED_FOR_DELIVERY"
    save_json(state_path, state)
    gate.update({"status": "APPROVED_FOR_DELIVERY", "state_sha256": digest(state_path), "render_approval": {"review_version": review.get("review_version"), "review_sha256": digest(review_path), "weighted_total": total, "quote": quote, "approved_at": datetime.now(timezone.utc).isoformat()}})
    save_json(gate_path, gate)
    print("APPROVED_FOR_DELIVERY")


def verify(root: Path):
    _, state_path, plan_path, gate_path = paths(root)
    require_valid(root)
    if not gate_path.exists(): raise SystemExit("gate.json is missing")
    gate = load_json(gate_path)
    failures = []
    if gate.get("state_sha256") != digest(state_path): failures.append("state.json hash mismatch")
    if gate.get("plan_sha256") != digest(plan_path): failures.append("production-plan.md hash mismatch")
    render = gate.get("render_approval")
    if render:
        matches = list((root / GATE_DIR).glob("review-*.json"))
        if not any(digest(item) == render.get("review_sha256") for item in matches): failures.append("approved review file missing or changed")
    if failures:
        for item in failures: print(f"ERROR: {item}", file=sys.stderr)
        raise SystemExit(1)
    print(gate.get("status", "UNKNOWN"))


def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("validate", "verify"):
        cmd = sub.add_parser(name); cmd.add_argument("--root", type=Path, default=Path("."))
    cmd = sub.add_parser("approve-plan"); cmd.add_argument("--root", type=Path, default=Path(".")); cmd.add_argument("--quote", required=True)
    cmd = sub.add_parser("score"); cmd.add_argument("--root", type=Path, default=Path(".")); cmd.add_argument("--review", type=Path, required=True)
    cmd = sub.add_parser("approve-render"); cmd.add_argument("--root", type=Path, default=Path(".")); cmd.add_argument("--review", type=Path, required=True); cmd.add_argument("--quote", required=True)
    args = parser.parse_args()
    if args.command == "validate":
        errors = validate(args.root)
        if errors:
            for error in errors: print(f"ERROR: {error}")
            raise SystemExit(1)
        print("VALID")
    elif args.command == "verify": verify(args.root)
    elif args.command == "approve-plan": approve_plan(args.root, args.quote)
    elif args.command == "score":
        status = score(args.root, args.review)
        if status in {"REJECTED", "CONCEPT_ONLY_REVIEW"}: raise SystemExit(1)
    elif args.command == "approve-render": approve_render(args.root, args.review, args.quote)


if __name__ == "__main__": main()
