# Versions

Behavior-affecting changes to the skill pack, newest first. Follows semver for the pack
as a whole (see `package.json`).

## Unreleased

- Added opt-in autonomous sale completion to `opskeep-retail-sell`, off by default. A shop
  can turn on `autonomous_with_escalation` (`opskeep-retail-manage`, new
  `references/transaction-autonomy.md`) so the agent completes a routine, already-priced
  sale end-to-end without holding for per-message approval, escalating anything outside
  that authorization to a new `opskeep-escalate-to-owner` skill instead of guessing. That
  skill checks via `composio-mcp` for real live conversation handoff (WhatsApp Business
  API's "claim conversation" takeover, confirmed to exist and preserve full context,
  requires the API tier not the free app) before falling back to a notify-and-pause
  escalation, backed by a new open-source MCP scaffold (`escalate_to_owner`,
  `resolve_escalation`, `list_escalations`). Scoped to `opskeep-retail` only for now.
- Added WhatsApp as a Communication connector category in `opskeep-manage`,
  `opskeep-retail-manage`, and `opskeep-hospitality-manage`, and to `PRODUCT.md`'s Pro/
  Managed tier connector lists, to match a marketing repositioning toward WhatsApp-first
  small businesses.
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
- Added `references/reddit-social-content.md` to `opskeep-get-work`: researches Reddit
  conversations on a topic through a connected Reddit toolkit, extracts source-grounded
  signal, and drafts a social post (copy + image, or an image brief if no image tool is
  connected). Image generation and publishing route through `opskeep-tools`/composio and
  are gated on explicit, per-post approval — nothing publishes automatically.
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
- Migrated `lane` (and, in `composio-mcp`, `tags`) from a top-level frontmatter field into
  `metadata` across all 32 skills (core + both verticals), for conformance with the
  [Agent Skills open standard](https://agentskills.io/specification), which only allows
  `name`/`description`/`license`/`compatibility`/`metadata`/`allowed-tools` at the top
  level. `scripts/validate-skills.js` now checks name format/length, that `name` matches
  its parent directory, and that `lane` isn't left at the top level. Documented verified
  install paths for Cursor, Codex CLI, Cline, and ChatGPT (via Skills upload) in the
  README's new "Other agent runtimes" section.

## 0.1.0 (2026-07-24)

- First public structure. Skills are starter-quality: routing and output shape are defined,
  content will deepen as real usage feeds back in.
