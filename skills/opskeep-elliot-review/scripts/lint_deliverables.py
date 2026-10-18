#!/usr/bin/env python3
"""Lint the two deliverables of an Opskeep Elliot Review before delivery.

Usage:
  python scripts/lint_deliverables.py --dashboard opskeep-elliot-review-dashboard.html \
      --report opskeep-elliot-review-report.md [--repo PATH]

Checks (all errors unless noted):
  * dashboard is self-contained: no external src/srcset/poster/data/action/<link>, no CSS url()/@import
    to remote hosts, no network APIs in inline script
  * no secret-shaped values in either file
  * no security score, grade or percentage rating
  * finding ids, severities, confidence, state, refs and counts agree between dashboard and report
  * every OBSERVED non-INFO finding has repository-relative `path:line` evidence (line >= 1)
  * all review coverage areas appear in both files, with a reason when not REVIEWED
  * posture and limitations are present and the posture strings agree
  * standards refs exist in references/standards-crosswalk.yaml (when present)
  * with --repo: evidence files exist and the cited line is within the file

The dashboard and report markers it expects are defined in references/dashboard-spec.md.
Exit codes: 0 clean, 1 problems found, 2 cannot read inputs.
"""
import argparse
import os
import re
import sys
from html.parser import HTMLParser

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

HERE = os.path.dirname(os.path.abspath(__file__))
CROSSWALK = os.path.join(HERE, "..", "references", "standards-crosswalk.yaml")

SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]
CONFIDENCE = ["HIGH", "MEDIUM", "LOW"]
STATES = ["OBSERVED", "INFERRED"]
COVERAGE = ["REVIEWED", "PARTIAL", "NOT_ASSESSED", "NOT_APPLICABLE"]
POSTURES = ["Immediate action", "Needs attention", "Manageable gaps", "No major static signals found"]
AREAS = [
    "ORIENTATION", "ARCHITECTURE", "IDENTITY_AUTHZ", "DATA_SECRETS", "INPUT_API_ABUSE",
    "DEPENDENCIES_BUILD", "DELIVERY_INFRA", "LOGGING_RECOVERY", "TESTS_EVIDENCE", "AI_AGENT", "BASELINE_DRIFT",
]
FINDING_ID = re.compile(r"^ER-[A-Z]+-\d{3}$")
REF_RE = re.compile(r"^(ASVS-5\.0|OWASP-T10-2025|OWASP-LLM-2025|OWASP-ASI-2026|SSDF-1\.1|SLSA-1\.2|CISA-SBD):[A-Za-z0-9._-]+$")
EVIDENCE_RE = re.compile(r"([A-Za-z0-9_@+./\\-]+):(\d+)")
URL_ATTRS = {"src", "srcset", "poster", "data", "action", "formaction", "manifest"}
REMOTE = re.compile(r"^\s*(?:https?:)?//|^\s*(?:ftp|wss?):", re.IGNORECASE)
CSS_REMOTE = re.compile(r"(?i)url\(\s*['\"]?\s*(?:https?:)?//|@import\s+(?:url\()?\s*['\"]?\s*(?:https?:)?//")
NETWORK_JS = re.compile(r"\b(fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket\s*\(|EventSource\s*\(|importScripts\s*\(|import\s*\()")
SECRET_PATTERNS = [
    (re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"), "private key block"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "AWS access key id"),
    (re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}\b"), "GitHub token"),
    (re.compile(r"\bsk-(?:ant-|live_|proj-)?[A-Za-z0-9_-]{20,}\b"), "API secret key"),
    (re.compile(r"\bxox[abprs]-[A-Za-z0-9-]{10,}\b"), "Slack token"),
    (re.compile(r"(?i)\b(password|passwd|secret|api_key|token)\s*[:=]\s*['\"]?(?!\[?REDACTED)[^\s'\"<]{8,}"), "credential assignment"),
]
SCORE_PATTERNS = [
    re.compile(r"(?i)\b(security|posture|risk|overall)\s+(score|grade|rating)\b"),
    re.compile(r"\b\d{1,3}\s*/\s*100\b"),
]


class Dash(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.findings = {}      # id -> attrs
        self.areas = {}         # area -> coverage
        self.counts = {}        # severity -> int (displayed)
        self.posture = None
        self.has_limitations = False
        self.problems = []
        self._style = False
        self._script = False
        self._cap = None        # (kind, key, depth) while capturing element text
        self._depth = 0
        self._buf = []

    def handle_starttag(self, tag, attrs):
        self._depth += 1
        a = {k: (v or "") for k, v in attrs}
        for k, v in a.items():
            if k in URL_ATTRS and v and REMOTE.match(v) or (k == "srcset" and "//" in v and REMOTE.search(v)):
                self.problems.append(f"dashboard: external reference in <{tag} {k}=...>")
        if tag == "link" and a.get("href") and REMOTE.match(a["href"]):
            self.problems.append("dashboard: external <link href> (stylesheet/font/preload)")
        if "style" in a and CSS_REMOTE.search(a["style"]):
            self.problems.append("dashboard: remote url() or @import in a style attribute")
        if tag == "meta" and a.get("http-equiv", "").lower() == "refresh":
            self.problems.append("dashboard: meta refresh is not allowed")
        if tag == "style":
            self._style = True
        if tag == "script":
            self._script = True
        if "data-finding" in a:
            fid = a["data-finding"]
            if fid in self.findings:
                self.problems.append(f"dashboard: duplicate finding row {fid}")
            self.findings[fid] = {"severity": a.get("data-severity", ""), "confidence": a.get("data-confidence", ""),
                                  "state": a.get("data-state", ""), "refs": a.get("data-refs", "").split()}
        if "data-area" in a:
            self.areas[a["data-area"]] = a.get("data-coverage", "")
        if "data-posture" in a:
            self._cap = ("posture", None, self._depth)
            self._buf = []
        if "data-count" in a:
            self._cap = ("count", a["data-count"], self._depth)
            self._buf = []
        if a.get("data-section") == "limitations":
            self.has_limitations = True

    def handle_endtag(self, tag):
        if tag == "style":
            self._style = False
        if tag == "script":
            self._script = False
        if self._cap and self._depth == self._cap[2]:
            text = "".join(self._buf).strip()
            kind, key, _ = self._cap
            if kind == "posture":
                self.posture = text
            else:
                try:
                    self.counts[key] = int(text)
                except ValueError:
                    self.problems.append(f"dashboard: data-count={key} is not an integer ('{text}')")
            self._cap = None
        self._depth -= 1

    def handle_data(self, data):
        if self._style and CSS_REMOTE.search(data):
            self.problems.append("dashboard: remote url() or @import in <style>")
        if self._script and NETWORK_JS.search(data):
            self.problems.append("dashboard: network API used in inline script")
        if self._cap:
            self._buf.append(data)


def parse_report(text):
    findings, areas = {}, {}
    posture = counts = None
    blocks = re.split(r"(?m)^(?=### ER-)", text)
    for b in blocks:
        m = re.match(r"### (ER-[A-Z]+-\d{3})\b[^\n]*", b)
        if not m:
            continue
        fid = m.group(1)
        sev = re.search(r"Severity:\s*([A-Z]+)", b)
        conf = re.search(r"Confidence:\s*([A-Z]+)", b)
        state = re.search(r"State:\s*([A-Z]+)", b)
        refs = re.search(r"(?m)^Refs:\s*(.*)$", b)
        ev = re.search(r"(?m)^Evidence:\s*(.*)$", b)
        findings[fid] = {"severity": sev.group(1) if sev else "", "confidence": conf.group(1) if conf else "",
                         "state": state.group(1) if state else "", "refs": refs.group(1).split() if refs and refs.group(1).strip() else [],
                         "evidence": ev.group(1) if ev else ""}
    for m in re.finditer(r"(?m)^\|\s*([A-Z_]+)\s*\|\s*(REVIEWED|PARTIAL|NOT_ASSESSED|NOT_APPLICABLE)\s*\|\s*(.*?)\s*\|\s*$", text):
        areas[m.group(1)] = (m.group(2), m.group(3))
    m = re.search(r"(?m)^Posture:\s*(.+?)\s*$", text)
    posture = m.group(1) if m else None
    m = re.search(r"(?m)^Counts:\s*(.+)$", text)
    if m:
        counts = {k: int(v) for k, v in re.findall(r"([A-Z]+)=(\d+)", m.group(1))}
    has_limits = bool(re.search(r"(?m)^##\s+.*Limitations", text))
    return findings, areas, posture, counts, has_limits


def crosswalk_ids():
    if yaml is None or not os.path.exists(CROSSWALK):
        return None
    with open(CROSSWALK, encoding="utf-8") as fh:
        cw = yaml.safe_load(fh)
    return {f"{sid}:{it['id']}" for sid, s in cw["standards"].items() for it in s["items"]}


def lint(dashboard_path, report_path, repo=None):
    problems = []
    with open(dashboard_path, encoding="utf-8") as fh:
        dash_text = fh.read()
    with open(report_path, encoding="utf-8") as fh:
        rep_text = fh.read()

    d = Dash()
    d.feed(dash_text)
    problems += d.problems
    if "<html" not in dash_text.lower():
        problems.append("dashboard: not an HTML document")

    for label, text in (("dashboard", dash_text), ("report", rep_text)):
        for pat, name in SECRET_PATTERNS:
            if pat.search(text):
                problems.append(f"{label}: possible secret in output ({name}); redact it")
        for pat in SCORE_PATTERNS:
            if pat.search(text):
                problems.append(f"{label}: contains a security score/grade/rating; use a plain-language posture instead")

    rf, ra, rposture, rcounts, rlimits = parse_report(rep_text)

    if set(d.findings) != set(rf):
        only_d = sorted(set(d.findings) - set(rf))
        only_r = sorted(set(rf) - set(d.findings))
        if only_d:
            problems.append(f"findings only in dashboard: {', '.join(only_d)}")
        if only_r:
            problems.append(f"findings only in report: {', '.join(only_r)}")
    xw = crosswalk_ids()
    for fid in sorted(set(d.findings) & set(rf)):
        if not FINDING_ID.match(fid):
            problems.append(f"{fid}: id must look like ER-AUTH-001")
        df, rr = d.findings[fid], rf[fid]
        for field, allowed in (("severity", SEVERITIES), ("confidence", CONFIDENCE), ("state", STATES)):
            if df[field] not in allowed:
                problems.append(f"{fid}: dashboard {field} '{df[field]}' not in {allowed}")
            if rr[field] not in allowed:
                problems.append(f"{fid}: report {field} '{rr[field]}' not in {allowed}")
            if df[field] != rr[field]:
                problems.append(f"{fid}: {field} differs (dashboard {df[field]}, report {rr[field]})")
        if sorted(df["refs"]) != sorted(rr["refs"]):
            problems.append(f"{fid}: standards refs differ between dashboard and report")
        for ref in set(df["refs"]) | set(rr["refs"]):
            if not REF_RE.match(ref):
                problems.append(f"{fid}: '{ref}' is not a valid standard reference")
            elif xw is not None and ref not in xw:
                problems.append(f"{fid}: '{ref}' is not in references/standards-crosswalk.yaml")
        needs_evidence = rr["state"] == "OBSERVED" and rr["severity"] != "INFO"
        m = EVIDENCE_RE.search(rr["evidence"])
        if needs_evidence and not m:
            problems.append(f"{fid}: OBSERVED finding needs repository-relative evidence as path:line")
        if m:
            path, line = m.group(1), int(m.group(2))
            if path.startswith("/") or re.match(r"^[A-Za-z]:[\\/]", path) or ".." in path.split("/"):
                problems.append(f"{fid}: evidence path must be repository-relative ({path})")
            if line < 1:
                problems.append(f"{fid}: evidence line must be one-based ({line})")
            if repo and not path.startswith("/"):
                full = os.path.join(repo, path)
                if not os.path.isfile(full):
                    problems.append(f"{fid}: evidence file not found in repository: {path}")
                elif line >= 1:
                    with open(full, "rb") as fh:
                        n = sum(1 for _ in fh)
                    if line > n:
                        problems.append(f"{fid}: evidence line {line} is beyond the end of {path} ({n} lines)")

    actual = {s: sum(1 for f in rf.values() if f["severity"] == s) for s in SEVERITIES}
    if rcounts is None:
        problems.append("report: missing 'Counts:' line (e.g. Counts: CRITICAL=0 HIGH=2 MEDIUM=1 LOW=0 INFO=3)")
    else:
        for s in SEVERITIES:
            if rcounts.get(s) != actual[s]:
                problems.append(f"report: Counts {s}={rcounts.get(s)} but {actual[s]} finding(s) have that severity")
    for s in SEVERITIES:
        if s not in d.counts:
            problems.append(f"dashboard: missing data-count for {s}")
        elif d.counts[s] != actual[s]:
            problems.append(f"dashboard: count {s}={d.counts[s]} but {actual[s]} finding(s) have that severity")

    for area in AREAS:
        if area not in d.areas:
            problems.append(f"dashboard: coverage area {area} missing")
        elif d.areas[area] not in COVERAGE:
            problems.append(f"dashboard: coverage area {area} has invalid value '{d.areas[area]}'")
        if area not in ra:
            problems.append(f"report: coverage area {area} missing from the coverage table")
        else:
            val, reason = ra[area]
            if val != "REVIEWED" and not reason:
                problems.append(f"report: coverage area {area} is {val} but gives no reason")
            if area in d.areas and d.areas[area] != val:
                problems.append(f"coverage area {area} differs (dashboard {d.areas[area]}, report {val})")

    if d.posture not in POSTURES:
        problems.append(f"dashboard: posture '{d.posture}' must be one of {POSTURES}")
    if rposture not in POSTURES:
        problems.append(f"report: Posture '{rposture}' must be one of {POSTURES}")
    if d.posture in POSTURES and rposture in POSTURES and d.posture != rposture:
        problems.append(f"posture differs (dashboard '{d.posture}', report '{rposture}')")
    if not d.has_limitations:
        problems.append('dashboard: missing a data-section="limitations" section')
    if not rlimits:
        problems.append("report: missing a Limitations section")
    return problems


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dashboard", required=True)
    ap.add_argument("--report", required=True)
    ap.add_argument("--repo", help="repository root; verifies evidence files and line numbers (read-only)")
    args = ap.parse_args(argv)
    try:
        problems = lint(args.dashboard, args.report, args.repo)
    except OSError as exc:
        print(f"ERROR: cannot read inputs: {exc}", file=sys.stderr)
        return 2
    for p in problems:
        print(f"PROBLEM: {p}")
    print(f"{'FAIL' if problems else 'PASS'}: {len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
