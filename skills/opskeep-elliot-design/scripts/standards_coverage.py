#!/usr/bin/env python3
"""Compute standards coverage from references/standards-crosswalk.yaml.

Usage: python scripts/standards_coverage.py [--crosswalk PATH] [--min 80] [--json]

Scores COVERED=1.0, PARTIAL=0.5, GAP=0.0 and excludes NOT_APPLICABLE items.
Reports each standard, the overall figure, and the figure restricted to standards whose item
IDs were read from a primary source (basis PRIMARY), and the figure for CROSS_CHECKED and RECALLED items. Exits 1 if the overall figure is
below --min, so a CI job can stop the crosswalk from silently decaying.
Also validates the crosswalk itself: statuses, domains, mechanism text, N/A reasons.
"""
import argparse
import json
import os
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import validate_baseline as vb  # noqa: E402

DEFAULT = os.path.join(HERE, "..", "references", "standards-crosswalk.yaml")
SCORE = {"COVERED": 1.0, "PARTIAL": 0.5, "GAP": 0.0}
STATUSES = list(SCORE) + ["NOT_APPLICABLE"]
BASES = ["PRIMARY", "CROSS_CHECKED", "RECALLED"]


def basis_of(std, item):
    return item.get("basis") or std.get("basis")


def load(path):
    with open(path, encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def check(cw):
    problems = []
    seen = set()
    for std_id, std in (cw.get("standards") or {}).items():
        if "verified" not in std or not isinstance(std["verified"], bool):
            problems.append(f"{std_id}: 'verified' must be true or false")
        if std.get("basis") not in BASES:
            problems.append(f"{std_id}: 'basis' must be one of {BASES}")
        if std.get("verified") is True and std.get("basis") != "PRIMARY":
            problems.append(f"{std_id}: verified: true requires basis PRIMARY")
        if std.get("verified") is False and std.get("basis") == "PRIMARY":
            problems.append(f"{std_id}: basis PRIMARY but verified is false")
        for item in std.get("items") or []:
            ref = f"{std_id}:{item.get('id')}"
            if ref in seen:
                problems.append(f"{ref}: duplicate")
            seen.add(ref)
            if item.get("basis") is not None:
                if item["basis"] not in BASES:
                    problems.append(f"{ref}: basis must be one of {BASES}")
                elif std.get("basis") != "PRIMARY" and item["basis"] == "PRIMARY":
                    problems.append(f"{ref}: an item cannot be PRIMARY inside a non-PRIMARY standard")
            if item.get("status") not in STATUSES:
                problems.append(f"{ref}: status must be one of {STATUSES}")
            if not item.get("mechanism"):
                problems.append(f"{ref}: mechanism text is required")
            if item.get("status") == "NOT_APPLICABLE" and not item.get("reason"):
                problems.append(f"{ref}: NOT_APPLICABLE requires a reason")
            for d in item.get("domains") or []:
                if d not in vb.CONTROL_DOMAINS:
                    problems.append(f"{ref}: unknown domain '{d}'")
            if item.get("status") == "COVERED" and not item.get("domains"):
                problems.append(f"{ref}: COVERED needs at least one control domain")
            if not vb.REF_RE.match(ref):
                problems.append(f"{ref}: not a valid reference id for the validator (update REF_RE in validate_baseline.py)")
    enforced = {d for ds in vb.REQUIRED_DOMAINS.values() for d in ds}
    used = {d for std in cw["standards"].values() for it in std.get("items") or [] for d in it.get("domains") or []}
    for d in sorted(enforced - used):
        problems.append(f"required domain {d} is not referenced by any crosswalk item")
    return problems


def score(items):
    counted = [i for i in items if i["status"] != "NOT_APPLICABLE"]
    pts = sum(SCORE[i["status"]] for i in counted)
    return pts, len(counted)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--crosswalk", default=DEFAULT)
    ap.add_argument("--min", type=float, default=80.0)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    cw = load(args.crosswalk)
    problems = check(cw)
    rows, tot_p, tot_n, ver_p, ver_n = [], 0.0, 0, 0.0, 0
    by_basis = {b: [0.0, 0] for b in BASES}
    gaps = []
    for std_id, std in cw["standards"].items():
        pts, n = score(std["items"])
        tot_p, tot_n = tot_p + pts, tot_n + n
        for it in std["items"]:
            if it["status"] == "NOT_APPLICABLE":
                continue
            b = basis_of(std, it)
            if b in by_basis:
                by_basis[b][0] += SCORE[it["status"]]
                by_basis[b][1] += 1
        ver_p, ver_n = by_basis["PRIMARY"]
        rows.append({"standard": std_id, "verified": std["verified"], "basis": std.get("basis"), "points": pts, "items": n,
                     "percent": round(100 * pts / n, 1) if n else None})
        gaps += [f"{std_id}:{i['id']} ({i['status']})" for i in std["items"] if i["status"] in ("PARTIAL", "GAP")]
    overall = round(100 * tot_p / tot_n, 1) if tot_n else 0.0
    verified_only = round(100 * ver_p / ver_n, 1) if ver_n else None
    basis_pct = {b: {"items": n, "percent": round(100 * p / n, 1) if n else None} for b, (p, n) in by_basis.items()}
    result = {"overall_percent": overall, "verified_standards_percent": verified_only, "by_basis": basis_pct,
              "items_scored": tot_n,
              "by_standard": rows, "partial_or_gap": gaps, "crosswalk_problems": problems,
              "verified_on": cw.get("verified_on")}
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Crosswalk verified_on {cw.get('verified_on')}")
        for row in rows:
            flag = row["basis"]
            print(f"  {row['standard']:<18} {row['percent']:>5}%  ({row['points']}/{row['items']})  [{flag}]")
        print(f"Overall: {overall}% of {tot_n} items (COVERED=1, PARTIAL=0.5)")
        print(f"PRIMARY-source items only: {verified_only}% of {ver_n} items")
        for b in ("CROSS_CHECKED", "RECALLED"):
            if basis_pct[b]["items"]:
                print(f"{b} items: {basis_pct[b]['percent']}% of {basis_pct[b]['items']} items")
        print(f"PARTIAL/GAP items: {len(gaps)}")
        for p in problems:
            print(f"PROBLEM: {p}")
    if problems:
        return 1
    return 0 if overall >= args.min else 1


if __name__ == "__main__":
    sys.exit(main())
