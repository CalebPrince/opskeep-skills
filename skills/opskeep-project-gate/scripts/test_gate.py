#!/usr/bin/env python3
"""End-to-end checks for the project gate. Run: python scripts/test_gate.py"""
import copy
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import gatelib as G  # noqa: E402

EXAMPLE = json.loads((ROOT / "references" / "example-state.json").read_text(encoding="utf-8"))
CASES = []


def case(fn):
    CASES.append(fn)
    return fn


def run(*args, cwd=None):
    return subprocess.run([sys.executable, *map(str, args)], capture_output=True, text=True, cwd=cwd)


@case
def example_state_is_valid():
    errs, _ = G.validate(EXAMPLE)
    return errs == []


@case
def strategy_block_is_required():
    s = copy.deepcopy(EXAMPLE)
    s.pop("strategy")
    errs, _ = G.validate(s)
    return any("strategy block is required" in e for e in errs)


@case
def constraint_bet_assets_outcomes_are_required():
    s = copy.deepcopy(EXAMPLE)
    s["strategy"]["constraint"]["statement"] = " "
    s["strategy"]["bet"].pop("wager")
    s["strategy"]["existing_assets"] = []
    s["strategy"]["outcomes"] = []
    errs, _ = G.validate(s)
    need = ("constraint.statement", "bet.wager", "existing_assets", "strategy.outcomes")
    return all(any(n in e for e in errs) for n in need)


@case
def activity_outcomes_and_missing_evidence_warn():
    s = copy.deepcopy(EXAMPLE)
    s["strategy"]["outcomes"] = ["Build a client portal"]
    s["strategy"]["constraint"]["evidence"] = ""
    s["strategy"]["forces"]["anxiety"] = ""
    errs, warns = G.validate(s)
    return not errs and any("reads like an activity" in w for w in warns) and any("evidence" in w for w in warns) \
        and any("forces.anxiety" in w for w in warns)


@case
def rejected_options_are_the_unselected_directions():
    s = copy.deepcopy(EXAMPLE)
    s["selected_direction"] = s["directions"][0]["id"]
    rej = G.rejected_options(s)
    return len(rej) == len(s["directions"]) - 1 and all(r["reason"] for r in rej)


@case
def workshop_leads_with_the_problem_section():
    with tempfile.TemporaryDirectory() as td:
        out = pathlib.Path(td) / "w.html"
        r = run(HERE / "render.py", "workshop", "--project", "X", "--out", out)
        html = out.read_text(encoding="utf-8") if out.exists() else ""
        return r.returncode == 0 and "s_constraint" in html and "s_anxiety" in html and html.index("s_constraint") < html.index("p_name")


@case
def workshop_can_drop_answered_strategy_controls():
    with tempfile.TemporaryDirectory() as td:
        out = pathlib.Path(td) / "w.html"
        r = run(HERE / "render.py", "workshop", "--project", "X", "--drop", "s_constraint,s_evidence", "--out", out)
        html = out.read_text(encoding="utf-8")
        return r.returncode == 0 and '"id": "s_constraint"' not in html and '"id": "s_anxiety"' in html


@case
def full_flow_approve_writes_intake_and_seals():
    with tempfile.TemporaryDirectory() as td:
        d = pathlib.Path(td) / ".opskeep" / "project-gate"
        d.mkdir(parents=True)
        s = copy.deepcopy(EXAMPLE)
        s["gate"] = {"status": "not_approved", "history": []}
        for dec in s["decisions"]:
            if dec["status"] in ("NEEDS_INPUT", "REJECTED"):
                dec["status"] = "CONFIRMED"
                dec["value"] = dec.get("value") or "decided"
        s["conflicts"] = []
        s["selected_direction"] = s["directions"][0]["id"]
        (d / "state.json").write_text(json.dumps(s), encoding="utf-8")
        dash = d / "ui" / "dashboard.html"
        if run(HERE / "render.py", "dashboard", "--state", d / "state.json", "--out", dash).returncode:
            return False
        html = dash.read_text(encoding="utf-8")
        if "The problem" not in html:
            return False
        resp = {"schema": G.RESPONSE_SCHEMA, "project": s["project"]["slug"], "base_hash": G.state_hash(s),
                "action": "approve_project_gate", "selected_direction": s["selected_direction"], "changes": []}
        (d / "resp.json").write_text(json.dumps(resp), encoding="utf-8")
        r = run(HERE / "gate.py", "--dir", d, "apply", "--response", d / "resp.json")
        if r.returncode:
            print(r.stderr)
            return False
        intake = (d / "intake.yaml").read_text(encoding="utf-8")
        proj = (d / "PROJECT.md").read_text(encoding="utf-8")
        if not all(k in intake for k in ("constraint:", "bet:", "rejected_options:", "existing_assets:")):
            return False
        if "## The problem" not in proj or "## Paths considered and rejected" not in proj:
            return False
        for name in ("DESIGN.md", "screens.md", "components.md", "responsive.md", "accessibility.md"):
            (d / name).write_text(f"# {name}\n" + "Decision text. " * 40, encoding="utf-8")
        if run(HERE / "gate.py", "--dir", d, "seal").returncode:
            return False
        if run(HERE / "gate.py", "--dir", d, "verify").returncode:
            return False
        (d / "intake.yaml").write_text(intake + "\n# edited", encoding="utf-8")
        return run(HERE / "gate.py", "--dir", d, "verify").returncode == 1   # intake.yaml is sealed


def main():
    failures = 0
    for fn in CASES:
        try:
            ok = bool(fn())
        except Exception as exc:
            ok = False
            print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        print(f"{'ok  ' if ok else 'FAIL'} {fn.__name__}")
        failures += not ok
    print(f"\n{len(CASES) - failures}/{len(CASES)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
