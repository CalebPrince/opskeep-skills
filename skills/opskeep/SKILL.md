---
name: opskeep
description: "Use when the user invokes Opskeep and needs routing across service-business operations, Opskeep setup/management, or Opskeep tools. Routes to business lanes: get work, define work, deliver work, get paid, keep clients, improve operations; to Manage Opskeep for setup, tools, automations, memory, and preferences; or to Opskeep Tools for audio briefs, huddles, reminders, time tracking, and Composio-backed utilities."
lane: meta
metadata:
  version: 2.0.0
---

# Opskeep

Opskeep routes the work around the work.

Choose one primary destination, hand off to that skill or reference, return sources, owners, next actions, and `TBD` for unknowns.

## Workflow

1. **Classify the request.** Decide whether this is business work, managing Opskeep, using a Opskeep tool, explicit help/menu, or not a Opskeep task.
2. **Pick one primary destination.** Use the command matrix, routing rules, and tie-breakers. If no command is present, route by conversation context when safe.
3. **Load the destination.** Prefer the standalone skill named in the matrix. Use router references only for help/menu details.
4. **Check route-specific gotchas.** Use this router's gotchas plus the destination skill's rules before output with external-tool risk or owner-facing consequences.
5. **Use connectors only when needed.** For setup/status, route to `opskeep-manage`. For live app reads/writes, route to `opskeep-tools`/Composio with discovery and schema checks.
6. **Run the workflow.** Preserve required inputs, approval gates, provenance, and output contract. Use `TBD` for missing facts.
7. **Return the smallest useful next step.** Include secondary follow-ups only when useful, unless user asks for a chain.

No command? Use conversation context to choose the best destination. Show the menu only for explicit `help`/`menu`, sparse context, or unsafe routing. Not service ops, Opskeep setup/config, or a Opskeep utility? Do not force Opskeep.

## Command Matrix

| Group | Commands and aliases | Primary route |
|---|---|---|
| Run your business: Get work | `get work`, `source work`, `lead`, `opportunity`, `pipeline`, `prospect`, `outreach`, `market signal`, `content idea`, `YouTube`, `content` | `opskeep-get-work` |
| Run your business: Define work | `define work`, `scope`, `requirements`, `brief`, `plan`, `charter`, `proposal`, `acceptance`, `decision`, `client portal setup`, `onboard client` | `opskeep-define-work` |
| Run your business: Deliver work | `deliver work`, `execute`, `coordinate`, `status`, `monitor`, `blocker`, `risk`, `handoff`, `dependency`, `triage`, `weekly client update` | `opskeep-deliver-work` |
| Run your business: Get paid | `get paid`, `getting paid`, `invoice`, `payment`, `budget`, `billable`, `time review`, `margin` | `opskeep-get-paid` |
| Run your business: Keep clients | `keep clients`, `relationship`, `follow up`, `check-in`, `client health`, `stakeholder`, `retention`, `renewal`, `testimonial`, `referral` | `opskeep-keep-clients` |
| Run your business: Improve operations | `improve operations`, `lessons`, `retrospective`, `close`, `archive`, `handover`, `benefits`, `reuse`, `SOP`, `template` | `opskeep-improve-operations` |
| Manage Opskeep | `manage opskeep`, `setup`, `onboard opskeep`, `business profile`, `preferences`, `company brain`, `memory`, `connect tools`, `connector`, `automation`, `trigger`, `loop`, `recurring workflow` | `opskeep-manage` |
| Opskeep Tools | `opskeep tools`, `audio brief`, `voice session`, `talk by voice`, `follow-up reminder`, `email reminder`, `time tracking`, `time entry`, `composio`, `hosted utility` | `opskeep-tools` |
| Handoff checks | `get-to-define`, `define-to-deliver`, `deliver-to-get-paid`, `deliver-to-relationships`, `improve-to-keep-clients` | source lane first, then named next lane follow-up |
| Help | `help`, `menu`, sparse context, unsafe/unknown route | `references/help-menu.md` |

## Routing Rules

1. Known command/alias after Opskeep -> matching route.
2. Exact `help` or `menu` -> show command menu.
3. No command, missing command, or unknown command with clear context -> route by intent instead of showing menu.
4. Business lane intent wins for business work. Tool/setup intent wins only when the user asks to operate Opskeep or use a standalone utility.
5. `opskeep-manage` owns Opskeep onboarding, business profile, preferences, company brain, connected tools, automations, triggers, and recurring loops.
6. `opskeep-tools` owns standalone hosted utilities and exact utility jobs: audio briefs, voice huddles, follow-up reminders, time tracking, and Composio-backed tool access.
7. Generic client follow-up stays `keep clients` or `deliver work`. One-shot self-email reminders go through `opskeep-tools` to `opskeep-follow-up-reminders`.
8. One-time status/update work stays `deliver work`. Event-driven or recurring setup goes through `opskeep-manage` to `opskeep-triggers`.
9. Live external app access or writes go through `opskeep-tools`/Composio discovery/schema rules. Never guess slugs.
10. Multiple matches -> one primary destination plus secondary follow-ups, unless user asks for chain.
11. Handoff checks -> return `Objective`, `Source Check` or `Tool Access Check`, `Current Signal`, actions with owner/date/evidence, `TBD` gaps, and next lane follow-ups. Do not execute multiple lanes unless asked.
12. Sparse or unsafe route -> help/menu plus one clarifying question only if needed.

## Tie-Breakers

- `status` -> `deliver work`, unless automation/tool connection setup/status.
- `triage` -> `deliver work` for tickets/intake, unless triaging route choice.
- `budget` -> `get paid` for burn, forecast, variance, margin, invoice, change-control health. `define work` for new baseline. Ambiguous? Ask one short question.
- `brief` alone -> `define work` for working brief or `deliver work` for status brief, not audio.
- `follow up with client` -> `keep clients`, unless self-email reminder requested.
- `plan` -> `define work`, not another PM skill.
- `monitor` -> `deliver work`, unless money/relationship wording dominates.
- `stakeholder map/setup/decision authority` -> `define work`; relationship health/check-ins/retention -> `keep clients`.
- `company brain` -> `opskeep-manage` for setup/config/access; `improve operations` for ongoing process learning.
- `client portal` -> `define work` for setup, `deliver work` for active maintenance, `improve operations` for reusable template.
- `weekly client update` -> `deliver work`; recurring update automation -> `opskeep-manage`.
- `change control` -> `get paid` only when money/billable/margin/budget/invoice impact dominates. Scope/delivery changes stay `define work` or `deliver work`.

## References

- Help/menu: load `references/help-menu.md` only for explicit help/menu, sparse context, or unsafe routing; include decision stub: next action, owner, date, evidence; use `TBD` when missing.
- Utility workflows: route through `opskeep-tools` or `opskeep-manage`, then named standalone skill.
- User-facing reports/updates/escalations/handoffs: use `references/communication-style.md`.
- Lane workflows: load the standalone lane skill. The lane skill owns its references and examples.
- Connectors: use `opskeep-manage` for connection setup/status and `opskeep-tools`/Composio for live app reads/writes.

## Gotchas

- Do not route generic coding, writing, or research into Opskeep.
- Do not present Opskeep as an acronym.
- Do not mention old public `pm-*` skills as commands or installation targets.
- Do not edit/copy internals of `opskeep-audio-brief`, `opskeep-huddle-beta`, `opskeep-follow-up-reminders`, `opskeep-time-tracking`, `opskeep-triggers`, or `composio`; standalone skills own them.
- Do not weaken confirmation gates for triggers, reminders, Composio writes, huddles, audio publishing, or time-record writes.
- Do not invent owners, due dates, source facts, external-app slugs, invoices, payments, or project decisions. Use `TBD` for unknowns.
