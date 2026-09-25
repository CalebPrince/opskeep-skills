#!/usr/bin/env python3
"""Regression tests for validate_baseline.py. Run: python scripts/test_validate_baseline.py"""
import copy
import os
import sys
import tempfile

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import validate_baseline as vb  # noqa: E402

EXAMPLE = os.path.join(HERE, "..", "assets", "security-baseline.example.yaml")
TEMPLATE = os.path.join(HERE, "..", "assets", "security-baseline.template.yaml")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def run(doc, *flags):
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False, encoding="utf-8") as fh:
        yaml.safe_dump(doc, fh, sort_keys=False)
        path = fh.name
    try:
        return vb.main([path, *flags])
    finally:
        os.unlink(path)


def approved(doc, scope=("development", "production")):
    d = copy.deepcopy(doc)
    d["decisions"][0]["status"] = "DECIDED"
    d["lifecycle"].update(status="APPROVED", development_lock="UNLOCKED", deployment_lock="UNLOCKED")
    digest = vb.design_digest(d)
    d["record_digest"] = digest
    d["approval"].update(decision="APPROVED", approver="site-owner", approved_at="2026-09-24T10:00:00Z",
                         baseline_version=d["baseline_version"], record_digest=digest, scope=list(scope))
    return d, digest


CASES = []


def case(fn):
    CASES.append(fn)
    return fn


@case
def template_lints(ex):
    return run(load(TEMPLATE)) == 0


@case
def example_lints(ex):
    return run(ex) == 0


@case
def unapproved_fails_gate(ex):
    return run(ex, "--require-approved") == 1


@case
def approved_passes_gate_with_protected_digest(ex):
    d, dg = approved(ex)
    return run(d, "--require-approved", "--expected-digest", dg, "--target", "production") == 0


@case
def design_change_after_approval_fails(ex):
    d, dg = approved(ex)
    d["data_flows"][0]["retention"] = "forever"
    return run(d) == 1 and run(d, "--require-approved", "--expected-digest", dg) == 1


@case
def implementation_progress_keeps_approval(ex):
    d, dg = approved(ex)
    d["controls"][1]["status"] = "IMPLEMENTED"
    d["gates"][1]["status"] = "CONFIGURED"
    d["evidence"][1].update(status="PASSED", observed_at="2026-09-25T09:00:00Z", observer="ci", location="https://ci.example/run/1")
    return run(d, "--require-approved", "--expected-digest", dg) == 0


@case
def self_edited_approval_rejected_by_protected_digest(ex):
    d, _ = approved(ex)
    d["identities"][0]["forbidden_actions"] = []
    dg = vb.design_digest(d)  # attacker recomputes digests inside the same change
    d["record_digest"] = d["approval"]["record_digest"] = dg
    _, protected = approved(ex)
    return run(d, "--require-approved", "--expected-digest", protected) == 1


@case
def approved_with_blocking_decision_fails(ex):
    d, _ = approved(ex)
    d["decisions"][0]["status"] = "OPEN"
    return run(d) == 1


@case
def expired_approval_fails_gate(ex):
    d, dg = approved(ex)
    d["approval"]["expires_at"] = "2020-01-01"
    return run(d, "--require-approved", "--expected-digest", dg) == 1


@case
def production_not_in_scope_fails(ex):
    d, dg = approved(ex, scope=("development",))
    return run(d, "--require-approved", "--expected-digest", dg, "--target", "production") == 1


@case
def stage_requires_passed_evidence(ex):
    d, dg = approved(ex)
    return run(d, "--require-approved", "--expected-digest", dg, "--stage", "PULL_REQUEST") == 1


@case
def verified_without_evidence_fails(ex):
    d = copy.deepcopy(ex)
    d["controls"][1]["status"] = "VERIFIED"
    return run(d) == 1


@case
def passed_evidence_without_observation_fails(ex):
    d = copy.deepcopy(ex)
    d["evidence"][1]["status"] = "PASSED"
    return run(d) == 1


@case
def unlocked_before_approval_fails(ex):
    d = copy.deepcopy(ex)
    d["lifecycle"]["development_lock"] = "UNLOCKED"
    return run(d) == 1


@case
def valid_spike_passes_lint_but_never_production(ex):
    d = copy.deepcopy(ex)
    d["risk"]["mode"] = "SPIKE"
    d["lifecycle"].update(production_posture="PRODUCTION_PROHIBITED", development_lock="SANDBOX_ONLY",
                          spike_expires_at="2026-10-08")
    ok_lint = run(d) == 0
    d2, dg = approved(d)
    d2["lifecycle"]["deployment_lock"] = "LOCKED"
    d2["lifecycle"]["development_lock"] = "SANDBOX_ONLY"
    dg = vb.design_digest(d2)
    return ok_lint and run(d2, "--require-approved", "--expected-digest", dg, "--target", "production") == 1


@case
def spike_without_expiry_fails(ex):
    d = copy.deepcopy(ex)
    d["risk"]["mode"] = "SPIKE"
    d["lifecycle"].update(production_posture="PRODUCTION_PROHIBITED", development_lock="SANDBOX_ONLY")
    return run(d) == 1


@case
def mode_below_tier_fails(ex):
    d = copy.deepcopy(ex)
    d["risk"]["tier"] = "HIGH"
    return run(d) == 1


@case
def dangling_reference_fails(ex):
    d = copy.deepcopy(ex)
    d["threats"][0]["control_ids"].append("CTL-NOPE-999")
    return run(d) == 1


@case
def untraced_control_fails_after_draft(ex):
    d = copy.deepcopy(ex)
    d["controls"].append({"id": "CTL-LOG-001", "domain": "LOGGING", "requirement": "x", "status": "PLANNED",
                          "owner": "dev", "acceptance": "y", "evidence_ids": []})
    return run(d) == 1


@case
def secret_in_baseline_fails(ex):
    d = copy.deepcopy(ex)
    d["project"]["purpose"] = "token: ghp_abcdefghijklmnopqrstuvwxyz0123456789AB"
    return run(d) == 1


@case
def suspended_needs_change_record(ex):
    d, _ = approved(ex)
    d["lifecycle"].update(status="SUSPENDED", development_lock="LOCKED", deployment_lock="LOCKED")
    d["approval"]["decision"] = "SUSPENDED"
    no_chg = run(d) == 1
    d["changes"].append({"id": "CHG-001", "type": "ADDED", "targets": ["CMP-002"], "description": "Add payments",
                         "security_impact": "HIGH", "material": True, "status": "PROPOSED",
                         "from_version": "1.0.0", "to_version": "1.1.0"})
    d["record_digest"] = d["approval"]["record_digest"] = None
    return no_chg and run(d) == 0


def main():
    ex = load(EXAMPLE)
    failures = 0
    devnull = open(os.devnull, "w")
    for fn in CASES:
        stdout = sys.stdout
        sys.stdout = devnull
        try:
            ok = fn(ex)
        finally:
            sys.stdout = stdout
        print(f"{'ok  ' if ok else 'FAIL'} {fn.__name__}")
        failures += not ok
    print(f"\n{len(CASES) - failures}/{len(CASES)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
