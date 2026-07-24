# Versions

Behavior-affecting changes to the skill pack, newest first. Follows semver for the pack
as a whole (see `package.json`).

## Unreleased

- Initial scaffold: core router, six business-lane skills, two meta skills.
- Added recurring (daily/weekly/monthly) email reminders under `opskeep-manage`, backed by
  a new open-source MCP scaffold (`schedule_recurring_reminder`, `cancel_recurring_reminder`,
  `list_recurring_reminders`). `opskeep-follow-up-reminders` now hands off recurring
  requests to `opskeep-manage` instead of refusing them outright.
- Added sole-trader coverage: short reference notes on `opskeep-define-work`,
  `opskeep-deliver-work`, `opskeep-get-paid`, and `opskeep-keep-clients` for solo
  tradespeople/freelancers, plus a new `opskeep-expense-tracking` breakout skill (backed
  by a new open-source MCP scaffold: `log_expense`, `list_expenses`,
  `summarize_expenses`, `delete_expense`) for job-tagged materials/mileage costs that
  `opskeep-get-paid` can fold into an invoice.
- Added `references/video-to-sop.md` to `opskeep-improve-operations`: turns a video
  tutorial, link, or transcript into a step-by-step SOP for the team, with the same
  source-safety/prompt-injection handling used by `opskeep-audio-brief`.
- Built `opskeep-retail` as a full sibling pack: 8 skills (router, six lanes, manage)
  under `verticals/opskeep-retail/skills/`, staged separately from the core pack. No
  hardcoded POS/inventory platform; live reads/writes route through shared
  `composio-mcp` discovery. `scripts/validate-skills.js` now also lints skills staged
  under `verticals/*/skills/`.
- Built `opskeep-hospitality` as a full sibling pack: 8 skills (router, six lanes,
  manage) under `verticals/opskeep-hospitality/skills/`. Same no-hardcoded-platform and
  no-fabricated-hosted-infra resolutions as `opskeep-retail`, plus food-safety/labor-
  compliance handled as a cross-cutting Boundaries rule on the affected lane skills
  (surface the flag, never adjudicate legality) rather than its own lane.

## 0.1.0 (2026-07-24)

- First public structure. Skills are starter-quality: routing and output shape are defined,
  content will deepen as real usage feeds back in.
