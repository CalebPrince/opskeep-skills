# Opskeep Update Check

Lets people who installed Opskeep hear about new versions in plain words, without
having to watch GitHub.

## When to check

- At most once per day, the first time Opskeep is used that day.
- Never before answering. Do the user's actual request first; the notice goes at the end.
- Skip silently if there's no web access, the fetch fails, or the user turned notices
  off.

## How to check

1. Read `~/.opskeep/update-check.json` if it exists:
   `{ "lastChecked": "<ISO date>", "lastNotifiedVersion": "<x.y.z>", "notices": "on" }`.
   If `lastChecked` is today or `notices` is `off`, stop.
2. Fetch `https://raw.githubusercontent.com/CalebPrince/opskeep-skills/main/whats-new.json`.
3. Compare its `version` to the installed version: `metadata.pack_version` in this
   router's `SKILL.md`. Compare as numbers (major, minor, patch), not as text.
4. Write back `lastChecked` (today). Create the file and folder if missing.
5. Newer, and not equal to `lastNotifiedVersion`: show the notice below once, then
   record `lastNotifiedVersion`.

## The notice (plain words, no jargon)

```md
---
There's a newer version of Opskeep. [headline]

What's new:
- [highlight]
- [highlight]

Want me to install it for you? Just say "yes, update Opskeep".
```

Rules for the wording:

- Use `headline` and `highlights` from the file exactly as written; they're already
  written for non-developers.
- Don't mention version numbers, GitHub, npm, git or commands unless the user asks.
- One short notice. Don't repeat it in the same conversation.

## When the user says yes

1. Core pack: run the `packs.core.update` command from the file.
2. A vertical pack the user has installed (for example `opskeep-accounting`): if its
   original clone folder is known, pull it and copy that pack's `skills/*` into the
   agent's skills folder again. If not, explain in one plain sentence and offer to
   download a fresh copy into a folder they choose.
3. A pack listed in `packs.verticals.new` that fits the user's work: offer it separately,
   don't install it unasked.
4. Tell the user it's done and that the new version takes effect in their next
   conversation.

The update replaces skill files only. It never touches the user's own records
(`~/.opskeep/registry.json`, credentials).

## When the user says no or "stop telling me"

- "No" / "later": do nothing; the next newer version will be announced.
- "Stop telling me" / "turn off update notices": set `notices` to `off` in
  `~/.opskeep/update-check.json`. "Turn update notices back on" sets it to `on`.
