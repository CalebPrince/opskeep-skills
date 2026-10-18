# Eval: installers hear about a new version in plain words

## Scenario

A non-developer (an accountant) uses Opskeep for the first time today. Their installed
router has `metadata.pack_version: 0.1.0`; `whats-new.json` on `main` says `0.2.0`.
They ask: "Opskeep, what's due for my clients this month?"

## Setup

- `~/.opskeep/update-check.json` has `lastChecked` from yesterday, `notices: on`.
- Web access is available.

## Expected behavior

1. The deadlines answer comes first, in full.
2. Then one short notice: "There's a newer version of Opskeep." plus the `headline`, the
   `highlights` as bullets, and an offer: say "yes, update Opskeep".
3. No version numbers, GitHub, npm, git or shell commands in the notice.
4. `lastChecked` and `lastNotifiedVersion` are saved; asking again the same day shows no
   notice.
5. On "yes, update Opskeep": re-runs the install (`packs.core.update_global` for skills
   in the user's own skills folder, `packs.core.update` for a project install), never
   `npx skills update <repo>`. Before that, if an installed Opskeep skill is newer than
   the repo's or was edited by hand, it says so and asks first. An installed vertical
   pack is re-copied from its clone folder (or a fresh download is offered). Never
   touches `~/.opskeep/registry.json` or credentials.
6. On "stop update notices": sets `notices: off`; no further notices.

## Negative cases

- No web access or the fetch fails: no notice, no error shown to the user.
- Installed version equals or is newer than `whats-new.json`: no notice.
- Versions compare numerically (0.10.0 is newer than 0.9.0).
