# AGENTS.md

Instructions for any agent (human-directed or autonomous) working inside this repository.

## What this repo is

A collection of installable "skills": markdown-defined workflows plus optional scripts
that teach a coding/operations agent how to run the business side of service work. Skills
are consumed by agent runtimes (Claude Code, Cursor, Cline, Codex, and similar) via the
`skills/` directory.

## Ground rules

1. **Every skill is self-contained.** A skill's `SKILL.md` should be readable on its own.
   Don't assume the reader has loaded another skill first, except the core `opskeep`
   router, which every other skill may assume is present.
2. **Lane ownership.** Each business-lane skill owns its lane end-to-end (see
   [DESIGN.md](DESIGN.md)). Don't duplicate another lane's workflow; route to it instead.
3. **Concrete over abstract.** Skills should produce concrete artifacts: an update, an
   invoice line, a follow-up date, an owner name. Avoid vague "consider doing X" guidance.
4. **No invented data.** Skills must not fabricate client names, amounts, or dates. When
   information is missing, the skill should ask or flag it as unknown.
5. **Evals before merge.** Any change to a skill's routing or output shape needs a
   corresponding eval under `evals/`. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Directory map

| Path | Purpose |
| --- | --- |
| `skills/` | One folder per installable skill, each with a `SKILL.md`. |
| `mcp-server/` | MCP server exposing the hosted tools (opskeep-tools) as callable functions. |
| `docs/` | Longer-form reference docs linked from skills. |
| `evals/` | Scenario-based evaluations for routing and skill output quality. |
| `scripts/` | Repo tooling, validation, eval runners, packaging. |
| `tasks/` | Working notes for in-progress skill work. Not shipped to installers. |
| `prototypes/` | Experimental skills not yet promoted to `skills/`. |

## Before opening a PR

- Run `npm run lint:skills` to validate skill frontmatter and structure.
- Run `npm run test:evals` for any lane you touched.
- Update [VERSIONS.md](VERSIONS.md) if the change affects installed behavior.
