"""Shared helpers for Opskeep-project-gate: hashing, readiness, validation, contrast."""
import hashlib
import json
import re

VERSION = "1.1.0"
STATE_SCHEMA = "opskeep.project-gate/state@1"
RESPONSE_SCHEMA = "opskeep.project-gate/response@1"
ANSWERS_SCHEMA = "opskeep.project-gate/answers@1"

STATUSES = ["INFERRED", "PROPOSED", "CONFIRMED", "NEEDS_INPUT", "REJECTED", "SUPERSEDED"]
AREAS = ["strategy", "project", "users", "ux", "screens", "visual", "responsive", "accessibility"]
REQUIRED_COLORS = ["bg", "surface", "text", "muted", "primary", "primary_contrast"]
READINESS_WEIGHT = {"CONFIRMED": 1.0, "INFERRED": 0.75, "PROPOSED": 0.5, "NEEDS_INPUT": 0.0, "REJECTED": 0.0}


def canon(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def state_hash(state):
    """Hash of everything except gate bookkeeping, so history/timestamps don't churn it."""
    body = {k: v for k, v in state.items() if k != "gate"}
    return hashlib.sha256(canon(body).encode("utf-8")).hexdigest()[:16]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def counts(state):
    c = {s: 0 for s in STATUSES}
    for d in state.get("decisions", []):
        c[d["status"]] += 1
    return c


def readiness(state):
    c = counts(state)
    active = sum(c[s] for s in STATUSES if s != "SUPERSEDED")
    if not active:
        return 0
    score = sum(READINESS_WEIGHT.get(s, 0) * c[s] for s in STATUSES)
    return round(score / active * 100)


def active_conflicts(state):
    by_id = {d["id"]: d for d in state.get("decisions", [])}
    live = lambda d: d is not None and d["status"] not in ("REJECTED", "SUPERSEDED")
    return [c for c in state.get("conflicts", []) if live(by_id.get(c["a"])) and live(by_id.get(c["b"]))]


# ---------- contrast (WCAG) ----------
def _rgb(hexstr):
    h = hexstr.strip().lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    if not re.fullmatch(r"[0-9a-fA-F]{6}", h):
        raise ValueError(f"bad colour {hexstr!r}")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def luminance(hexstr):
    r, g, b = _rgb(hexstr)
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


CONTRAST_PAIRS = [("text", "bg"), ("text", "surface"), ("muted", "bg"), ("muted", "surface"),
                  ("primary_contrast", "primary")]


def check_palette(color, label):
    errs = []
    for k in REQUIRED_COLORS:
        if k not in color:
            errs.append(f"{label}: missing colour token '{k}'")
    if errs:
        return errs
    for fg, bg in CONTRAST_PAIRS:
        try:
            r = contrast(color[fg], color[bg])
        except ValueError as e:
            errs.append(f"{label}: {e}")
            continue
        if r < 4.5:
            errs.append(f"{label}: {fg} on {bg} contrast {r:.2f}:1 is below WCAG AA 4.5:1")
    return errs


# ---------- validation ----------
def validate(state):
    errors, warnings = [], []
    if state.get("schema") != STATE_SCHEMA:
        errors.append(f"schema must be {STATE_SCHEMA}")
    proj = state.get("project") or {}
    if not proj.get("name"):
        errors.append("project.name is required")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", proj.get("slug", "")):
        errors.append("project.slug must be lowercase letters, digits, hyphens")

    ids = set()
    decisions = state.get("decisions", [])
    if not decisions:
        errors.append("no decisions")
    for d in decisions:
        i = d.get("id", "?")
        if not re.fullmatch(r"PG-\d{3}", i):
            errors.append(f"{i}: id must look like PG-001")
        if i in ids:
            errors.append(f"{i}: duplicate id")
        ids.add(i)
        if d.get("status") not in STATUSES:
            errors.append(f"{i}: invalid status {d.get('status')!r}")
        if d.get("area") not in AREAS:
            errors.append(f"{i}: area must be one of {AREAS}")
        if not d.get("title"):
            errors.append(f"{i}: title required")
        if d.get("status") != "NEEDS_INPUT" and not d.get("value"):
            errors.append(f"{i}: value required unless NEEDS_INPUT")
        if d.get("status") == "NEEDS_INPUT" and not (d.get("options") or d.get("question")):
            warnings.append(f"{i}: NEEDS_INPUT should carry options or a question")
        if d.get("status") == "CONFIRMED" and d.get("confirmed_via") not in ("interview", "explicit", "gate_approval"):
            warnings.append(f"{i}: CONFIRMED without confirmed_via (interview|explicit|gate_approval)")
    for d in decisions:
        for dep in d.get("depends_on", []):
            if dep not in ids:
                errors.append(f"{d['id']}: depends_on unknown id {dep}")
            if dep == d["id"]:
                errors.append(f"{d['id']}: depends on itself")
    for c in state.get("conflicts", []):
        for k in ("a", "b"):
            if c.get(k) not in ids:
                errors.append(f"conflict references unknown id {c.get(k)}")

    for t in state.get("character", []):
        if not (0 <= t.get("score", -1) <= 100):
            errors.append(f"character '{t.get('trait')}' score must be 0-100")

    dirs = state.get("directions", [])
    if not 2 <= len(dirs) <= 3:
        errors.append("provide 2-3 design directions")
    dir_ids = set()
    for x in dirs:
        i = x.get("id", "?")
        dir_ids.add(i)
        for k in ("name", "tagline", "fit", "tradeoffs"):
            if not x.get(k):
                errors.append(f"direction {i}: '{k}' required")
        if not isinstance(x.get("foundation"), dict) or not x["foundation"]:
            errors.append(f"direction {i}: foundation map required")
        if not isinstance(x.get("preview"), dict):
            errors.append(f"direction {i}: preview spec required")
        tok = x.get("tokens") or {}
        errors += check_palette(tok.get("color") or {}, f"direction {i} tokens.color")
        if tok.get("color_dark"):
            errors += check_palette(tok["color_dark"], f"direction {i} tokens.color_dark")
        for k in ("radius", "font", "space"):
            if k not in tok:
                errors.append(f"direction {i}: tokens.{k} required")
    sel = state.get("selected_direction")
    if sel is not None and sel not in dir_ids:
        errors.append(f"selected_direction {sel!r} is not a direction id")
    se, sw = validate_strategy(state)
    errors += se
    warnings += sw
    return errors, warnings


ACTIVITY_START = re.compile(r"^\s*(build|builds|create|creates|add|adds|implement|implements|design|designs|launch|launches|make|makes|develop|develops|ship|ships)\b", re.I)


def _text(v):
    return isinstance(v, str) and bool(v.strip())


def validate_strategy(state):
    """The problem and the bet. Constraint first; outcomes, not activities; rejected paths come from the directions."""
    errors, warnings = [], []
    st = state.get("strategy")
    if not isinstance(st, dict):
        return ["strategy block is required: constraint, forces, existing_assets, bet, outcomes"], warnings
    cons = st.get("constraint") if isinstance(st.get("constraint"), dict) else {}
    if not _text(cons.get("statement")):
        errors.append("strategy.constraint.statement: name what is in the way of the outcome (not the thing to be built)")
    if not _text(cons.get("evidence")):
        warnings.append("strategy.constraint.evidence: say what shows this is the constraint, or record it as an assumption")
    forces = st.get("forces") if isinstance(st.get("forces"), dict) else {}
    for f in ("push", "pull", "anxiety", "habit"):
        if not _text(forces.get(f)):
            warnings.append(f"strategy.forces.{f}: not stated")
    ea = st.get("existing_assets")
    if not (isinstance(ea, list) and ea and all(_text(x) for x in ea)):
        errors.append('strategy.existing_assets: list what already works or exists, or ["none"]')
    bet = st.get("bet") if isinstance(st.get("bet"), dict) else {}
    for f in ("belief", "wager", "expected_outcome", "leading_indicator"):
        if not _text(bet.get(f)):
            errors.append(f"strategy.bet.{f}: complete 'We believe <belief>, so we are betting <wager> that this produces <expected_outcome>; we will watch <leading_indicator>'")
    outs = st.get("outcomes")
    if not (isinstance(outs, list) and outs and all(_text(x) for x in outs)):
        errors.append("strategy.outcomes: at least one outcome (what changes), not an activity")
    else:
        for o in outs:
            if ACTIVITY_START.match(o):
                warnings.append(f"strategy.outcomes: '{o[:50]}' reads like an activity; say what changes instead")
    return errors, warnings


def rejected_options(state):
    """Every direction that was not selected, with the honest cost recorded for it (why_not, else tradeoffs)."""
    sel = state.get("selected_direction")
    return [{"option": f"{x['name']}: {x['tagline']}", "reason": x.get("why_not") or x.get("tradeoffs", "")}
            for x in state.get("directions", []) if x["id"] != sel]


def approval_blockers(state):
    b = []
    c = counts(state)
    if c["NEEDS_INPUT"]:
        b.append(f"{c['NEEDS_INPUT']} decision(s) still need input")
    if c["REJECTED"]:
        b.append(f"{c['REJECTED']} rejected decision(s) need a replacement")
    n = len(active_conflicts(state))
    if n:
        b.append(f"{n} unresolved conflict(s)")
    if not state.get("selected_direction"):
        b.append("no design direction selected")
    errs, _ = validate(state)
    b += [f"invalid state: {e}" for e in errs]
    return b


def yaml_scalar(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return json.dumps(str(v), ensure_ascii=False)  # JSON strings are valid YAML


def yaml_dump(obj, indent=0):
    pad = "  " * indent
    out = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, (dict, list)) and v:
                if isinstance(v, list) and all(not isinstance(x, (dict, list)) for x in v):
                    out.append(f"{pad}{k}: [" + ", ".join(yaml_scalar(x) for x in v) + "]")
                else:
                    out.append(f"{pad}{k}:")
                    out.append(yaml_dump(v, indent + 1))
            elif isinstance(v, (dict, list)):
                out.append(f"{pad}{k}: " + ("{}" if isinstance(v, dict) else "[]"))
            else:
                out.append(f"{pad}{k}: {yaml_scalar(v)}")
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, dict):
                lines = yaml_dump(item, indent + 1).split("\n")
                first = lines[0].lstrip()
                out.append(f"{pad}- {first}")
                out.extend(lines[1:])
            else:
                out.append(f"{pad}- {yaml_scalar(item)}")
    return "\n".join(out)
