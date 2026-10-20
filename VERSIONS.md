# Versions

Behavior-affecting changes to the skill pack, newest first. Follows semver for the pack
as a whole (see `package.json`).

## Unreleased

- Added `opskeep-video-production-gate`, an implementation-neutral gate for reference-led ads, promos, explainers, recuts, and motion work. It requires verified audiovisual evidence, explicit `reuse` / `extend` / `invent` decisions, creative-director plan approval, deterministic state checks, and scored inspection of each exported render before delivery.
- Added a reusable production checklist and an eval covering mixed reuse, extension, invention, provenance uncertainty, and separate plan/render approvals. The Opskeep router, help menu, and library index now expose the gate.

## 0.4.0 - 2026-10-18

- `opskeep-project-gate`, `opskeep-elliot-design` and `opskeep-elliot-review` are now
  **lite** editions in the free pack (2.0.0-lite, 3.0.0-lite, 2.0.0-lite), under the same
  names. Project Gate Lite keeps the problem-first questions, five design questions and a
  one-page brief; Elliot Design Lite keeps risk triage and a starter `SECURITY.md` from a
  12-point checklist; Elliot Review Lite keeps a read-only quick scan with a findings list.
  Each ends its output with one line on what Opskeep Pro adds.
- The full versions (workshop, directions and approval dashboard; machine-checked baseline,
  CI enforcement and standards crosswalk; full assessments with dashboard and drift checks)
  moved to the private Opskeep Pro pack. Updating this pack replaces installed full copies
  with the lite ones; Pro users install Pro after this pack.
- Router rule 16 and the project-gate evals no longer assume the workshop.

## 0.3.1 - 2026-10-18

- `opskeep-elliot-design` 2.2.0 -> 2.5.1 (standard PC-SBD 2.1 -> 2.3) and
  `opskeep-elliot-review` 1.0.0 -> 1.1.1, brought in from the maintainer's newer local
  copies (each skill's `CHANGELOG.md` has the detail). Highlights: approval-gate bypass
  fixes with regression tests; standards crosswalk (OWASP Top 10:2025, LLM Top 10 2025,
  Agentic Top 10 2026, NIST SSDF 1.1, SLSA 1.2, CISA Secure by Design, ASVS 5.0) with
  `standards_coverage.py`; 18 control domains and an AI/agent checklist; schema 2.3
  required engineering, source and `ai_profile` fields; Elliot design reuses an approved
  `opskeep-project-gate` `intake.yaml` instead of asking again; Elliot review gains
  standards refs, optional user-approved scanner mode, baseline-drift feedback and
  `lint_deliverables.py`. `metadata.lane: security` kept so both pass lint. Tests: 58/58
  and 19/19.
- Fixed `opskeep-escalate-to-owner` not installing: its unquoted `description`
  contained ": ", so installers' YAML parser rejected the header and skipped the skill
  (installs got 20 of 21 core skills). `npm run lint:skills` now fails on unquoted
  top-level frontmatter values YAML can't parse.
- Fixed the documented update command. `npx skills update CalebPrince/opskeep-skills`
  never worked (`update` takes skill names, and only refreshes skills it already tracks,
  so it never adds new ones). README and `whats-new.json` now use the install command
  again (`npx skills add CalebPrince/opskeep-skills -y`, `-g` for a user-level install),
  which refreshes every skill and adds new ones. The update check picks the right scope
  and asks before overwriting an installed skill that is newer or was edited by hand.

## 0.3.0 - 2026-10-18

- Added `opskeep-project-gate` to the core pack: the first gate before any new app,
  website, dashboard or major redesign is built. It starts from the problem (constraint,
  forces, existing assets, the bet, outcomes), runs an interactive design workshop,
  produces 2-3 design directions and an approval dashboard, and seals an approved
  package (`.opskeep/project-gate/`, `gate.json` with file hashes). Approval covers the
  design direction only; `implementation_authorized` stays false. Bundled scripts
  (`gate.py`, `render.py`, `gatelib.py`) are local-only and ship with their own test
  suite (`python scripts/test_gate.py`, 8 checks).
- The sealed `gate.json` now names the real next gate, `opskeep-elliot-design`, instead
  of a non-existent `opskeep-security`.
- Core router 2.4.0 routes new-project, project-gate and design-decision intent to
  `opskeep-project-gate`, and security-gate intent to `opskeep-elliot-design` /
  `opskeep-elliot-review`; help menu gains a "Before you build" group.
- README and website list the skill under "Before you build" (21 core skills).

## 0.2.0 - 2026-10-17

First numbered release since 0.1.0; everything below this heading down to 0.1.0 ships in
it. Plain-language summary for installers lives in [`whats-new.json`](whats-new.json).

- Added the `opskeep-accounting` vertical pack (`verticals/opskeep-accounting/`) for
  accounting and bookkeeping practices: `opskeep-accounting` router plus engage (scope of
  services, onboarding/KYC checklist, finance health check), collect (records request
  lists, chase ladder), close (statement intake checks, bank/ledger reconciliation,
  bookkeeping review, fail-closed journal controls with maker-checker, close checklist),
  deadlines (sourced per-client compliance calendar, Ghana obligation-area checklist
  with no hardcoded dates or rates), report (management-accounts commentary, variances,
  KPIs, cash outlook) and manage (practice profile, client roster, sign-off policy,
  connectors). The practice's own billing reuses core `opskeep-get-paid`. The core
  router routes accounting-practice client work to it and returns the install path when
  it isn't installed.
- `opskeep-get-paid` 0.2.0: new `references/receivables.md` (aged receivables by bucket
  and currency, collection ladder, write-off proposals) and `references/billing-models.md`
  (hourly, fixed-fee, fixed-monthly and retainer billing, WIP, recovery,
  write-ups/downs, retainer drawdown); added the previously missing
  `references/examples/getting-paid.md`. Amounts in different currencies are never added.
- `opskeep-time-tracking` 0.2.0: billable/non-billable time and `invoice_ref` stored in
  record `metadata`; review mode reports unbilled time and its value per client and per
  currency; update mode marks entries billed. No new API endpoints.
- `opskeep-expense-tracking` 0.2.0 and its MCP tools: new categories (`travel`, `fees`,
  `software`), `billable` flag, receipt `reference`, date-range and billing-state filters,
  per-currency totals split into unbilled/billed/not billable (fixes summaries that added
  different currencies together), new `mark_expenses_billed` tool, and
  `OPSKEEP_DEFAULT_CURRENCY`. Existing entries read as billable and unbilled. Corrected
  the skill's outdated note that expenses reset on restart.
- Update notices: every router now carries `metadata.pack_version` and, once a day after
  answering, compares it with `whats-new.json` on `main`. A newer version is announced in
  plain words with an offer to install it; "stop update notices" turns it off
  (`~/.opskeep/update-check.json`). `npm run lint:skills` fails if `whats-new.json`,
  `package.json` and the routers' `pack_version` disagree.

- The `opskeep-tools` MCP server's store is now file-backed and survives restarts: all
  tool records (reminders, time entries, expenses, escalations, and the client registry)
  are written atomically to `~/.opskeep/registry.json` by default, overridable with
  `OPSKEEP_STORE_FILE`. The id counter persists too, so new records never collide with
  what is already on disk.
- Added `opskeep-manage-client-keys`: a per-client registry for the agent manager, tracking
  the API keys installed for a client's AI models (masked references only, never the key
  itself), how many keys each client has, credits bought per client, and what each client's
  agents use. Backed by eight new `opskeep-tools` MCP tools (`register_client`,
  `add_client_key`, `list_client_keys`, `remove_client_key`, `record_credit_purchase`,
  `get_client_balance`, `record_agent_usage`, `summarize_client_usage`). The `opskeep`
  router, help menu, and `opskeep-tools` route to it; `get paid` still owns invoicing and
  money follow-through.
- The core `opskeep` router now recognizes retail/shop and restaurant/venue business-model
  intent (stock, reorder, SKU, till, markdown or prep list, reservation, table, waitlist,
  close-out) and routes it to the separately installed `opskeep-retail` /
  `opskeep-hospitality` vertical routers instead of flattening it into core service lanes.
  When the matching vertical pack isn't installed, it returns the clone-and-copy install
  path rather than inventing or running vertical skills as if present. The router help
  menu now lists both vertical packs.
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
