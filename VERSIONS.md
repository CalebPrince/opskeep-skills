# Versions

Behavior-affecting changes to the skill pack, newest first. Follows semver for the pack
as a whole (see `package.json`).

## Unreleased

- Initial scaffold: core router, six business-lane skills, two meta skills.
- Added recurring (daily/weekly/monthly) email reminders under `opskeep-manage`, backed by
  a new open-source MCP scaffold (`schedule_recurring_reminder`, `cancel_recurring_reminder`,
  `list_recurring_reminders`). `opskeep-follow-up-reminders` now hands off recurring
  requests to `opskeep-manage` instead of refusing them outright.

## 0.1.0 (2026-07-24)

- First public structure. Skills are starter-quality: routing and output shape are defined,
  content will deepen as real usage feeds back in.
