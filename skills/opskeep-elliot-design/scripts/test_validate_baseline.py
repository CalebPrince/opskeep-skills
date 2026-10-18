#!/usr/bin/env python3
"""Regression tests for validate_baseline.py and standards_coverage.py.
Run: python scripts/test_validate_baseline.py
Cases marked EXPLOIT are the gate bypasses found in the 2.2.0 review; each must stay closed."""
import copy
import datetime as dt
import os
import sys
import tempfile

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import validate_baseline as vb  # noqa: E402
import standards_coverage as sc  # noqa: E402

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
    d["approval"]["scope"] = list(scope)  # scope is part of the digest, so set it first
    digest = vb.design_digest(d)
    d["record_digest"] = digest
    d["approval"].update(decision="APPROVED", approver="site-owner", approved_at="2026-09-24T10:00:00Z",
                         baseline_version=d["baseline_version"], record_digest=digest)
    return d, digest


def in_days(n):
    return (dt.date.today() + dt.timedelta(days=n)).isoformat()


CASES = []


def case(fn):
    CASES.append(fn)
    return fn


# ---------------------------------------------------------------- original behaviour
@case
def template_lints(ex):
    return run(load(TEMPLATE)) == 0


@case
def example_lints(ex):
    return run(ex, "--strict-warnings") == 0


@case
def unapproved_fails_gate(ex):
    return run(ex, "--require-approved", "--allow-self-asserted") == 1


def errs(doc, strict=True):
    """Validator errors (strict = a non-DRAFT lifecycle so trace gaps are errors) without the CI gate."""
    d = copy.deepcopy(doc)
    if strict:
        d["lifecycle"]["status"] = "REVIEW_REQUIRED"
        d["approval"]["decision"] = "PENDING"
    r, _ = vb.validate(d, yaml.safe_dump(d))
    return r.errors + r.warnings


def has(problems, fragment):
    return any(fragment in p for p in problems)


def full_ai_profile():
    prof = {k: {"status": "PLANNED", "practice": f"Practice for {k}"} for k in vb.AI_PRACTICES}
    prof["prompt_confidentiality"]["secrets_in_prompts"] = False
    return prof


def ai_doc(ex):
    d = copy.deepcopy(ex)
    d["components"].append({"id": "CMP-004", "name": "Chat assistant", "exposure": "INTERNET", "provider": "model-api",
                            "ai_capability": True})
    return d


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
    d["controls"][2]["status"] = "VERIFIED"
    d["controls"][2]["evidence_ids"] = ["EVD-002"]
    d["gates"][1]["status"] = "CONFIGURED"
    d["evidence"][1].update(status="PASSED", observed_at="2026-09-25T09:00:00Z", observer="ci", location="https://ci.example/run/1")
    return vb.design_digest(d) == dg and run(d, "--require-approved", "--expected-digest", dg) == 0


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


def make_spike(ex, expires):
    d = copy.deepcopy(ex)
    d["risk"]["mode"] = "SPIKE"
    d["lifecycle"].update(production_posture="PRODUCTION_PROHIBITED", development_lock="SANDBOX_ONLY",
                          spike_expires_at=expires)
    d["approval"]["scope"] = ["sandbox"]
    return d


@case
def valid_spike_passes_lint_but_never_production(ex):
    d = make_spike(ex, in_days(7))
    if run(d) != 0:
        return False
    d["decisions"][0]["status"] = "DECIDED"
    d["lifecycle"].update(status="APPROVED", deployment_lock="LOCKED", development_lock="SANDBOX_ONLY")
    d["approval"]["scope"] = ["sandbox"]
    dg = vb.design_digest(d)
    d["record_digest"] = dg
    d["approval"].update(decision="APPROVED", approver="site-owner", approved_at="2026-09-24T10:00:00Z",
                         baseline_version=d["baseline_version"], record_digest=dg)
    return (run(d, "--require-approved", "--expected-digest", dg, "--target", "production") == 1
            and run(d, "--require-approved", "--expected-digest", dg, "--target", "development") == 0)


@case
def spike_without_expiry_fails(ex):
    d = make_spike(ex, None)
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
    d["controls"].append({"id": "CTL-LOG-002", "domain": "LOGGING", "requirement": "x", "status": "PLANNED",
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


# ---------------------------------------------------------------- EXPLOIT regressions (2.2.0 review)
@case
def exploit_gate_requires_protected_digest(ex):
    """Forgetting --expected-digest used to PASS with a warning; it must now fail closed."""
    d, dg = approved(ex)
    return (run(d, "--require-approved", "--target", "production") == 1
            and run(d, "--require-approved", "--target", "production", "--allow-self-asserted") == 0)


@case
def exploit_scope_negation_not_accepted(ex):
    """'production' appearing inside a negation used to satisfy the production scope check."""
    d, dg = approved(ex, scope=("development", "Development only - production explicitly excluded"))
    return run(d) == 1 and run(d, "--require-approved", "--expected-digest", dg, "--target", "production") == 1


@case
def exploit_scope_and_lock_edit_cannot_reach_production(ex):
    """Widening approval.scope and unlocking deploys in the same PR must break the protected digest."""
    d0, dg = approved(ex, scope=("development",))
    d = copy.deepcopy(d0)
    d["approval"]["scope"] = ["development", "production"]
    d["lifecycle"]["deployment_lock"] = "UNLOCKED"
    return (vb.design_digest(d) != dg
            and run(d, "--require-approved", "--expected-digest", dg, "--target", "production") == 1)


@case
def exploit_retiring_control_after_approval_breaks_digest(ex):
    d0, dg = approved(ex)
    for new_status, extra in (("RETIRED", {}), ("NOT_APPLICABLE", {"reason": "dropped"}), ("UNRESOLVED", {"blocks_approval": False})):
        d = copy.deepcopy(d0)
        d["controls"][3].update(status=new_status, **extra)
        if vb.design_digest(d) == dg:
            return False
        if run(d, "--require-approved", "--expected-digest", dg) != 1:
            return False
    return True


@case
def exploit_disabling_gate_or_accepting_threat_breaks_digest(ex):
    d0, dg = approved(ex)
    g = copy.deepcopy(d0)
    g["gates"][1]["status"] = "DISABLED"
    t = copy.deepcopy(d0)
    t["threats"][0].update(status="ACCEPTED", owner="dev", acceptance_reason="ship it")
    return (vb.design_digest(g) != dg and vb.design_digest(t) != dg
            and run(g, "--require-approved", "--expected-digest", dg) == 1
            and run(t, "--require-approved", "--expected-digest", dg) == 1)


@case
def exploit_expired_spike_fails(ex):
    return run(make_spike(ex, "2020-01-01")) == 1 and run(make_spike(ex, in_days(3))) == 0


@case
def exploit_malformed_records_fail_cleanly(ex):
    d = copy.deepcopy(ex)
    d["assets"] = ["not-a-mapping"]
    d2 = copy.deepcopy(ex)
    d2["risk"] = ["not", "a", "mapping"]
    bad_yaml = tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False)
    bad_yaml.write("a: [unclosed")
    bad_yaml.close()
    try:
        rc_yaml = vb.main([bad_yaml.name])
    finally:
        os.unlink(bad_yaml.name)
    try:
        return run(d) == 1 and run(d2) == 1 and rc_yaml == 2 and run([1, 2, 3]) == 1
    except Exception:
        return False


@case
def exploit_timestamp_quoting_does_not_change_digest(ex):
    a = copy.deepcopy(ex)
    a["data_flows"][0]["reviewed_at"] = "2026-09-24T10:00:00Z"
    b = copy.deepcopy(ex)
    b["data_flows"][0]["reviewed_at"] = dt.datetime(2026, 9, 24, 10, 0, 0, tzinfo=dt.timezone.utc)
    c = copy.deepcopy(ex)
    c["data_flows"][0]["reviewed_at"] = "2026-09-24T10:00:00+00:00"
    return vb.design_digest(a) == vb.design_digest(b) == vb.design_digest(c)


# ---------------------------------------------------------------- schema 2.2 checks
@case
def scope_entries_must_start_with_environment_token(ex):
    d = copy.deepcopy(ex)
    d["approval"]["scope"] = ["everything"]
    ok = copy.deepcopy(ex)
    ok["approval"]["scope"] = ["production:eu-region", "staging"]
    return run(d) == 1 and run(ok) == 0


@case
def spike_scope_cannot_name_production(ex):
    d = make_spike(ex, in_days(5))
    d["approval"]["scope"] = ["sandbox", "production"]
    return run(d) == 1


@case
def required_control_domains_enforced(ex):
    d = copy.deepcopy(ex)
    for c in d["controls"]:
        if c["id"] == "CTL-LOG-001":
            c["domain"] = "CONFIG"
    return run(d) == 1


@case
def not_applicable_control_with_reason_satisfies_domain(ex):
    d = copy.deepcopy(ex)
    for c in d["controls"]:
        if c["id"] == "CTL-LOG-001":
            c.update(status="NOT_APPLICABLE", reason="Hosting provider logs only; no application logging exists")
    d["threats"] = [t for t in d["threats"] if t["id"] != "THR-005"]
    d["controls"].append({"id": "CTL-LOG-002", "domain": "LOGGING", "requirement": "x", "status": "NOT_APPLICABLE",
                          "reason": "No application logging", "owner": "dev", "acceptance": "y", "evidence_ids": []})
    return run(d) == 0


@case
def ai_component_requires_ai_agent_domain(ex):
    d = copy.deepcopy(ex)
    d["components"].append({"id": "CMP-004", "name": "Chat assistant", "exposure": "INTERNET", "provider": "model-api",
                            "ai_capability": True})
    if run(d) != 1:
        return False
    d["controls"].append({"id": "CTL-AI-001", "domain": "AI_AGENT", "requirement": "Treat model output as untrusted; allow-list tools",
                          "status": "PLANNED", "owner": "dev", "acceptance": "Injection test cannot trigger a tool call",
                          "refs": ["OWASP-LLM-2025:LLM01"], "evidence_ids": []})
    d["threats"].append({"id": "THR-006", "component_ids": ["CMP-004"], "scenario": "Prompt injection abuses tools",
                         "likelihood": "MEDIUM", "impact": "MEDIUM", "control_ids": ["CTL-AI-001"],
                         "refs": ["OWASP-LLM-2025:LLM01", "OWASP-ASI-2026:ASI01"], "residual_risk": "MEDIUM",
                         "owner": "dev", "status": "OPEN"})
    if run(d) != 1:      # still missing the ai_profile
        return False
    d["ai_profile"] = full_ai_profile()
    return run(d) == 0


@case
def assurance_below_policy_needs_deviation(ex):
    d = copy.deepcopy(ex)
    d["risk"]["assurance"]["slsa_build_level"] = 0
    if run(d) != 1:
        return False
    d["risk"]["assurance"]["deviation_reason"] = "Static host builds on its own platform; provenance not yet available"
    return run(d) == 0


@case
def supply_chain_block_required(ex):
    d = copy.deepcopy(ex)
    del d["supply_chain"]
    return run(d) == 1


@case
def high_tier_requires_sbom_and_regulatory_assessment(ex):
    d = copy.deepcopy(ex)
    d["risk"].update(tier="HIGH", mode="FULL")
    d["risk"]["assurance"].update(asvs_level="L2", slsa_build_level=2)
    msgs = []
    import io, contextlib
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        run(d)
    out = buf.getvalue()
    return "supply_chain.sbom.required must be true at tier HIGH" in out and "required domains at tier HIGH" in out


@case
def unknown_standard_reference_fails(ex):
    d = copy.deepcopy(ex)
    d["controls"][0]["refs"] = ["OWASP-T10-2025:A99"]
    e = copy.deepcopy(ex)
    e["controls"][0]["refs"] = ["made-up"]
    return run(d) == 1 and run(e) == 1


@case
def retired_control_cannot_stay_referenced(ex):
    d = copy.deepcopy(ex)
    for c in d["controls"]:
        if c["id"] == "CTL-INP-001":
            c["status"] = "RETIRED"
    return run(d) == 1


@case
def legacy_schema_21_still_validates_with_warning(ex):
    d = copy.deepcopy(ex)
    d["schema_version"] = "2.1"
    for k in ("supply_chain",):
        d.pop(k)
    d["project"].pop("regulatory_context")
    d["risk"].pop("assurance")
    for coll in ("controls", "threats"):
        for rec in d[coll]:
            rec.pop("refs", None)
    d["approval"]["scope"] = []
    if run(d) != 0:
        return False
    d["decisions"][0]["status"] = "DECIDED"
    d["lifecycle"].update(status="APPROVED", development_lock="UNLOCKED", deployment_lock="UNLOCKED")
    dg = vb.design_digest(d)
    d["record_digest"] = dg
    d["approval"].update(decision="APPROVED", approver="o", approved_at="2026-09-24T10:00:00Z",
                         baseline_version=d["baseline_version"], record_digest=dg, scope=["development"])
    return vb.design_digest(d) == dg and run(d, "--require-approved", "--expected-digest", dg) == 0


@case
def print_digest_matches_function(ex):
    import io, contextlib
    with tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False, encoding="utf-8") as fh:
        yaml.safe_dump(ex, fh, sort_keys=False)
        path = fh.name
    try:
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = vb.main([path, "--print-digest"])
        return rc == 0 and buf.getvalue().strip() == vb.design_digest(ex)
    finally:
        os.unlink(path)


# ---------------------------------------------------------------- crosswalk
@case
def crosswalk_is_valid_and_meets_80_percent(ex):
    return sc.main(["--min", "80"]) == 0


@case
def crosswalk_ids_are_accepted_by_validator(ex):
    ids = vb.load_crosswalk_ids()
    return bool(ids) and "OWASP-T10-2025:A03" in ids and all(vb.REF_RE.match(i) for i in ids)


@case
def ai_profile_required_and_complete(ex):
    d = ai_doc(ex)
    if not has(errs(d), "ai_profile: required"):
        return False
    d["ai_profile"] = full_ai_profile()
    if has(errs(d), "ai_profile"):
        return False
    d["ai_profile"]["memory_policy"] = {"status": "NOT_APPLICABLE"}
    if not has(errs(d), "memory_policy: NOT_APPLICABLE requires a reason"):
        return False
    d["ai_profile"]["memory_policy"] = {"status": "PLANNED", "practice": ""}
    return has(errs(d), "ai_profile.memory_policy.practice")


@case
def secrets_in_prompts_must_be_false(ex):
    d = ai_doc(ex)
    d["ai_profile"] = full_ai_profile()
    d["ai_profile"]["prompt_confidentiality"]["secrets_in_prompts"] = True
    if not has(errs(d), "secrets_in_prompts must be false"):
        return False
    del d["ai_profile"]["prompt_confidentiality"]["secrets_in_prompts"]
    return has(errs(d), "secrets_in_prompts must be false")


@case
def engineering_practices_required_at_medium(ex):
    d = copy.deepcopy(ex)
    d["risk"]["tier"] = "MEDIUM"
    d["risk"]["mode"] = "STANDARD"
    d["risk"]["assurance"].update(asvs_level="L2", slsa_source_level=2)
    p = errs(d)
    needed = [k for k, v in vb.ENGINEERING_PRACTICES.items() if v[0] == "MEDIUM" and k not in d["engineering"]]
    return needed and all(has(p, f"engineering.{k}") for k in needed) and has(p, "monitoring_sources") and has(p, "triage_method")


@case
def high_tier_needs_build_hardening_root_cause_and_sponsor(ex):
    d = copy.deepcopy(ex)
    d["risk"].update(tier="HIGH", mode="FULL")
    d["risk"]["assurance"].update(asvs_level="L2", slsa_build_level=2, slsa_source_level=3)
    p = errs(d)
    return (has(p, "engineering.build_hardening") and has(p, "root_cause_practice")
            and has(p, "project.executive_sponsor") and has(p, "required_checks"))


@case
def build_level_3_needs_hardening_evidence(ex):
    d = copy.deepcopy(ex)
    d["risk"]["assurance"]["slsa_build_level"] = 3
    if not has(errs(d), "supply_chain.build_hardening: required"):
        return False
    d["supply_chain"]["build_hardening"] = {"platform": "hosted CI", "isolated_builds": True, "signing_keys_isolated": False}
    if not has(errs(d), "signing_keys_isolated must be true"):
        return False
    d["supply_chain"]["build_hardening"]["signing_keys_isolated"] = True
    return not has(errs(d), "build_hardening")


@case
def source_level_claims_need_matching_settings(ex):
    d = copy.deepcopy(ex)
    d["risk"]["assurance"]["slsa_source_level"] = 4
    p = errs(d)
    if not (has(p, "required_checks") and has(p, "TWO_PARTY")):
        return False
    d["source"].update(required_checks=["ci"], review_policy="TWO_PARTY")
    if has(errs(d), "source."):
        return False
    d["source"]["protected_branch"] = False
    return has(errs(d), "protected_branch")


@case
def source_level_below_policy_needs_deviation(ex):
    d = copy.deepcopy(ex)
    d["risk"]["assurance"]["slsa_source_level"] = 0
    if not has(errs(d), "below the policy minimum"):
        return False
    d["risk"]["assurance"]["deviation_reason"] = "Hosting platform offers no branch protection yet"
    return has(errs(d), "slsa_source_level 0 is below") and run(d) == 0

@case
def capability_flags_require_matching_practice_and_domain(ex):
    d = copy.deepcopy(ex)
    d["capabilities"].update(handles_files=True, uses_self_contained_tokens=True, uses_federated_login=True)
    d["risk"]["tier"] = "LOW"
    p = errs(d)
    return (has(p, "engineering.file_handling") and has(p, "engineering.token_validation")
            and has(p, "engineering.federated_login") and has(p, "FILE"))


@case
def capabilities_must_be_booleans(ex):
    d = copy.deepcopy(ex)
    d["capabilities"]["handles_files"] = "no"
    d["capabilities"].pop("uses_federated_login")
    p = errs(d)
    return has(p, "capabilities.handles_files must be true or false") and has(p, "capabilities.uses_federated_login")


@case
def practice_progress_does_not_change_digest_but_weakening_does(ex):
    d = copy.deepcopy(ex)
    base = vb.design_digest(d)
    d["engineering"]["secure_coding"]["status"] = "IMPLEMENTED"
    if vb.design_digest(d) != base:
        return False
    d["engineering"]["secure_coding"] = {"status": "NOT_APPLICABLE", "reason": "none"}
    return vb.design_digest(d) != base


@case
def schema_22_baselines_still_validate_with_a_warning(ex):
    d = copy.deepcopy(ex)
    d["schema_version"] = "2.2"
    for k in ("capabilities", "source", "engineering"):
        d.pop(k)
    d["risk"]["assurance"].pop("slsa_source_level")
    r, _ = vb.validate(d, yaml.safe_dump(d))
    return not r.errors and any("superseded" in w for w in r.warnings)


@case
def project_gate_requires_constraint_at_every_tier(ex):
    d = copy.deepcopy(ex)
    d["project"].pop("intake")
    if not has(errs(d), "project.intake: required"):
        return False
    d["project"]["intake"] = {"constraint": {"statement": "  "}}
    return has(errs(d), "constraint.statement")


@case
def project_gate_at_medium_needs_bet_forces_outcomes_and_rejected_paths(ex):
    d = copy.deepcopy(ex)
    d["risk"]["tier"] = "MEDIUM"
    d["risk"]["mode"] = "STANDARD"
    d["project"]["intake"] = {"constraint": {"statement": "Orders are lost at checkout"}}
    p = errs(d)
    for frag in ("constraint.evidence", "forces.anxiety", "existing_assets", "bet.belief", "bet.leading_indicator",
                 "outcomes", "rejected_options"):
        if not has(p, f"project.intake.{frag}"):
            return False
    d["project"]["intake"].update(rejected_options=[{"option": "Buy a platform"}])
    return has(errs(d), "rejected_options[0]: needs option and reason")


@case
def project_gate_complete_intake_passes_at_medium(ex):
    d = copy.deepcopy(ex)
    d["risk"]["tier"] = "MEDIUM"
    d["risk"]["mode"] = "STANDARD"
    return not has(errs(d), "project.intake")


@case
def project_gate_not_required_for_schema_22(ex):
    d = copy.deepcopy(ex)
    d["schema_version"] = "2.2"
    for k in ("capabilities", "source", "engineering"):
        d.pop(k)
    d["risk"]["assurance"].pop("slsa_source_level")
    d["project"].pop("intake")
    r, _ = vb.validate(d, yaml.safe_dump(d))
    return not r.errors


def main():
    ex = load(EXAMPLE)
    failures = 0
    devnull = open(os.devnull, "w")
    for fn in CASES:
        stdout = sys.stdout
        sys.stdout = devnull
        try:
            try:
                ok = fn(ex)
            except Exception as exc:  # a crash is a failure, never a pass
                ok = False
                print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        finally:
            sys.stdout = stdout
        print(f"{'ok  ' if ok else 'FAIL'} {fn.__name__}")
        failures += not ok
    print(f"\n{len(CASES) - failures}/{len(CASES)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
