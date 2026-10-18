#!/usr/bin/env python3
"""Tests for lint_deliverables.py. Run: python scripts/test_lint_deliverables.py"""
import os
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import lint_deliverables as L  # noqa: E402

AREAS = L.AREAS


def good_dashboard():
    rows = "".join(
        f'<tr data-area="{a}" data-coverage="{"REVIEWED" if a != "AI_AGENT" else "NOT_APPLICABLE"}"><td>{a}</td></tr>'
        for a in AREAS)
    counts = "".join(f'<span data-count="{s}">{n}</span>' for s, n in
                     (("CRITICAL", 0), ("HIGH", 1), ("MEDIUM", 1), ("LOW", 0), ("INFO", 1)))
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>Review</title>
<style>body{{font-family:system-ui}}</style></head><body>
<h1>Review</h1><p data-posture>Needs attention</p>{counts}
<table>
<tr data-finding="ER-AUTH-001" data-severity="HIGH" data-confidence="HIGH" data-state="OBSERVED" data-refs="OWASP-T10-2025:A01"><td>Missing authorization</td></tr>
<tr data-finding="ER-DEP-001" data-severity="MEDIUM" data-confidence="MEDIUM" data-state="INFERRED" data-refs="OWASP-T10-2025:A03"><td>Unpinned action</td></tr>
<tr data-finding="ER-LOG-001" data-severity="INFO" data-confidence="HIGH" data-state="OBSERVED"><td>Structured logging present</td></tr>
</table><table>{rows}</table>
<section data-section="limitations"><p>Static review only.</p></section>
<script>document.title = "Review";</script></body></html>"""


def good_report():
    table = "\n".join(
        f"| {a} | {'REVIEWED' if a != 'AI_AGENT' else 'NOT_APPLICABLE'} | {'' if a != 'AI_AGENT' else 'No model or agent code found'} |"
        for a in AREAS)
    return f"""# Opskeep Elliot Review

Posture: Needs attention
Counts: CRITICAL=0 HIGH=1 MEDIUM=1 LOW=0 INFO=1

## Coverage

| Area | Coverage | Reason |
|---|---|---|
{table}

## Findings

### ER-AUTH-001 — Missing authorization on export
Severity: HIGH · Confidence: HIGH · State: OBSERVED
Refs: OWASP-T10-2025:A01
Evidence: src/admin/export.ts:3

### ER-DEP-001 — Unpinned CI action
Severity: MEDIUM · Confidence: MEDIUM · State: INFERRED
Refs: OWASP-T10-2025:A03
Evidence: .github/workflows/ci.yml:1

### ER-LOG-001 — Structured logging present
Severity: INFO · Confidence: HIGH · State: OBSERVED
Evidence: src/log.ts:1

## Limitations

Static review only; nothing was executed.
"""


def run(dash, rep, repo=None):
    with tempfile.TemporaryDirectory() as td:
        dp, rp = os.path.join(td, "d.html"), os.path.join(td, "r.md")
        with open(dp, "w", encoding="utf-8") as fh:
            fh.write(dash)
        with open(rp, "w", encoding="utf-8") as fh:
            fh.write(rep)
        return L.lint(dp, rp, repo)


def has(problems, fragment):
    return any(fragment in p for p in problems)


CASES = []


def case(fn):
    CASES.append(fn)
    return fn


@case
def good_pair_passes():
    return run(good_dashboard(), good_report()) == []


@case
def external_stylesheet_and_script_fail():
    d = good_dashboard().replace("</head>", '<link rel="stylesheet" href="https://fonts.example/x.css"></head>')
    d2 = good_dashboard().replace("</body>", '<script src="https://cdn.example/x.js"></script></body>')
    return has(run(d, good_report()), "external") and has(run(d2, good_report()), "external")


@case
def remote_css_url_and_import_fail():
    d = good_dashboard().replace("body{font-family:system-ui}", "body{background:url(https://t.example/p.png)}")
    d2 = good_dashboard().replace("body{font-family:system-ui}", "@import 'https://fonts.example/x.css';")
    return has(run(d, good_report()), "remote url") and has(run(d2, good_report()), "remote url")


@case
def network_script_fails():
    d = good_dashboard().replace('document.title = "Review";', 'fetch("/x")')
    return has(run(d, good_report()), "network API")


@case
def secret_in_either_file_fails():
    r = good_report() + "\nPassword: hunter2hunter2\n"
    d = good_dashboard().replace("Static review only.", "key AKIAABCDEFGHIJKLMNOP leaked")
    return has(run(good_dashboard(), r), "possible secret") and has(run(d, good_report()), "possible secret")


@case
def redacted_secret_marker_is_allowed():
    r = good_report() + "\nEvidence shows token: [REDACTED] in config.\n"
    return run(good_dashboard(), r) == []


@case
def security_score_fails():
    d = good_dashboard().replace("Static review only.", "Security score: 82/100")
    return has(run(d, good_report()), "score/grade")


@case
def cvss_text_is_not_a_security_score():
    r = good_report().replace("Evidence: src/log.ts:1", "Evidence: src/log.ts:1\nNote: advisory lists a CVSS score of 7.5 for the dependency.")
    return run(good_dashboard(), r) == []


@case
def finding_sets_must_match():
    r = good_report() + "\n### ER-XSS-001 — Reflected input\nSeverity: LOW · Confidence: LOW · State: INFERRED\n"
    return has(run(good_dashboard(), r), "only in report")


@case
def severity_mismatch_fails():
    r = good_report().replace("Severity: HIGH", "Severity: CRITICAL")
    probs = run(good_dashboard(), r)
    return has(probs, "severity differs") and has(probs, "Counts")


@case
def displayed_counts_must_match():
    d = good_dashboard().replace('<span data-count="HIGH">1</span>', '<span data-count="HIGH">2</span>')
    return has(run(d, good_report()), "count HIGH=2")


@case
def observed_finding_needs_evidence():
    r = good_report().replace("Evidence: src/admin/export.ts:3", "Evidence: see the admin code")
    return has(run(good_dashboard(), r), "needs repository-relative evidence")


@case
def evidence_must_be_relative_and_one_based():
    r = good_report().replace("src/admin/export.ts:3", "/home/user/app/src/admin/export.ts:3")
    r2 = good_report().replace("src/admin/export.ts:3", "src/admin/export.ts:0")
    return has(run(good_dashboard(), r), "repository-relative") and has(run(good_dashboard(), r2), "one-based")


@case
def missing_coverage_area_or_reason_fails():
    r = good_report().replace("| IDENTITY_AUTHZ | REVIEWED | ", "| IDENTITY_AUTHZ_X | REVIEWED | ")
    r2 = good_report().replace("| AI_AGENT | NOT_APPLICABLE | No model or agent code found |", "| AI_AGENT | NOT_APPLICABLE |  |")
    return has(run(good_dashboard(), r), "IDENTITY_AUTHZ missing") and has(run(good_dashboard(), r2), "gives no reason")


@case
def posture_must_be_plain_language_and_agree():
    r = good_report().replace("Posture: Needs attention", "Posture: Excellent")
    r2 = good_report().replace("Posture: Needs attention", "Posture: Manageable gaps")
    return has(run(good_dashboard(), r), "must be one of") and has(run(good_dashboard(), r2), "posture differs")


@case
def limitations_required():
    d = good_dashboard().replace('data-section="limitations"', 'data-section="notes"')
    r = good_report().replace("## Limitations", "## Notes")
    probs = run(d, r)
    return has(probs, "limitations") and has(probs, "Limitations section")


@case
def unknown_standard_ref_fails():
    r = good_report().replace("OWASP-T10-2025:A01", "OWASP-T10-2025:A99")
    d = good_dashboard().replace("OWASP-T10-2025:A01", "OWASP-T10-2025:A99")
    return has(run(d, r), "not in references/standards-crosswalk.yaml")


@case
def repo_check_verifies_files_and_lines():
    with tempfile.TemporaryDirectory() as repo:
        os.makedirs(os.path.join(repo, "src", "admin"))
        os.makedirs(os.path.join(repo, ".github", "workflows"))
        with open(os.path.join(repo, "src", "admin", "export.ts"), "w") as fh:
            fh.write("a\nb\nc\n")
        with open(os.path.join(repo, ".github", "workflows", "ci.yml"), "w") as fh:
            fh.write("on: push\n")
        with open(os.path.join(repo, "src", "log.ts"), "w") as fh:
            fh.write("x\n")
        ok = run(good_dashboard(), good_report(), repo) == []
        os.remove(os.path.join(repo, "src", "log.ts"))
        bad = has(run(good_dashboard(), good_report(), repo), "evidence file not found")
        r = good_report().replace("export.ts:3", "export.ts:99")
        with open(os.path.join(repo, "src", "log.ts"), "w") as fh:
            fh.write("x\n")
        far = has(run(good_dashboard(), r, repo), "beyond the end")
        return ok and bad and far


@case
def crosswalk_copies_are_identical():
    other = os.path.join(HERE, "..", "..", "opskeep-elliot-design", "references", "standards-crosswalk.yaml")
    if not os.path.exists(other):
        return True  # installed on its own; nothing to compare against
    with open(L.CROSSWALK, "rb") as a, open(other, "rb") as b:
        return a.read() == b.read()


def main():
    failures = 0
    for fn in CASES:
        try:
            ok = fn()
        except Exception as exc:
            ok = False
            print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        print(f"{'ok  ' if ok else 'FAIL'} {fn.__name__}")
        failures += not ok
    print(f"\n{len(CASES) - failures}/{len(CASES)} passed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
