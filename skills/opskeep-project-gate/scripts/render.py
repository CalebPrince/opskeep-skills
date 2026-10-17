#!/usr/bin/env python3
"""Render the interactive Project Gate UIs into standalone HTML files.

  render.py workshop  [--questions bank.json] [--drop id,id] [--prefill prefill.json]
                      --project "LeadFlow" --out workshop.html
  render.py dashboard --state state.json --out dashboard.html

Both pages are fully self-contained (no network). They never write files themselves:
the user's choices come back as a JSON block (Copy / Download) that gate.py consumes.
"""
import argparse
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import gatelib  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"


def embed(obj):
    s = json.dumps(obj, ensure_ascii=True)
    return s.replace("</", "<\\/").replace("<!--", "<\\!--")


def build(template, data, title):
    html = (ASSETS / template).read_text(encoding="utf-8")
    html = html.replace("/*__COMMON_CSS__*/", (ASSETS / "common.css").read_text(encoding="utf-8"))
    html = html.replace("/*__COMMON_JS__*/", (ASSETS / "common.js").read_text(encoding="utf-8"))
    html = html.replace("__TITLE__", title.replace("<", ""))
    html = html.replace("/*__DATA__*/null", embed(data))
    return html


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    w = sub.add_parser("workshop")
    w.add_argument("--questions", default=str(ROOT / "references" / "workshop_bank.json"))
    w.add_argument("--drop", default="", help="comma-separated control ids to omit (already known)")
    w.add_argument("--prefill", help="JSON {control_id: value} inferred from the user's brief")
    w.add_argument("--project", default="")
    w.add_argument("--out", required=True)
    d = sub.add_parser("dashboard")
    d.add_argument("--state", required=True)
    d.add_argument("--out", required=True)
    a = ap.parse_args()

    if a.cmd == "workshop":
        bank = json.loads(pathlib.Path(a.questions).read_text(encoding="utf-8"))
        drop = {x.strip() for x in a.drop.split(",") if x.strip()}
        controls = [c for c in bank["controls"] if c["id"] not in drop]
        prefill = json.loads(pathlib.Path(a.prefill).read_text(encoding="utf-8")) if a.prefill else {}
        data = {
            "schema": gatelib.ANSWERS_SCHEMA,
            "project": a.project,
            "key": hashlib.sha256(json.dumps([c["id"] for c in controls]).encode()).hexdigest()[:10],
            "sections": bank["sections"],
            "controls": controls,
            "rules": bank["rules"],
            "prefill": prefill,
        }
        html = build("workshop.html", data, f"{a.project or 'Project'} Design Workshop")
    else:
        state = json.loads(pathlib.Path(a.state).read_text(encoding="utf-8"))
        errs, _ = gatelib.validate(state)
        if errs:
            print("State is invalid; fix before rendering:", *errs, sep="\n  - ")
            sys.exit(1)
        data = {"state": state, "base_hash": gatelib.state_hash(state)}
        html = build("dashboard.html", data, f"{state['project']['name']} Project Gate")

    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out} ({len(html) // 1024} KB)")


if __name__ == "__main__":
    main()
