# Contributing to Opskeep Skills

Thanks for considering a contribution. This project is small and opinionated on purpose.
Please open an issue before large structural changes so we can talk through fit first.

## Skill structure

Every skill lives in `skills/<skill-name>/` and contains at minimum:

```
skills/<skill-name>/
  SKILL.md          # required: frontmatter + instructions
  references/        # optional: supporting docs the skill links to
  examples/           # optional: sample inputs/outputs
```

`SKILL.md` frontmatter:

```yaml
---
name: opskeep-example
description: One or two sentences a router uses to decide when to trigger this skill.
lane: deliver-work     # one of the six business lanes, or "meta"
---
```

Keep the body focused on:

1. **When to trigger**: concrete phrases or situations.
2. **What to gather**: the minimum inputs needed before acting.
3. **What to produce**: the artifact shape (update, invoice line, reminder, etc.).
4. **Handoffs**: which other skills this one routes to, and when.

## Eval coverage

Add or update a scenario under `evals/cross-lane-handoffs/` whenever you change:

- routing logic in `skills/opskeep/SKILL.md`
- the output shape of a business-lane skill
- a handoff between two lanes

Run evals locally with:

```bash
npm run test:evals
```

## Versioning

This repo follows semver for the pack as a whole (see `package.json`). Note any
behavior-affecting change in [VERSIONS.md](VERSIONS.md) under an "Unreleased" heading.
Maintainers roll it into the next version bump.

## Pull requests

- Keep PRs scoped to one skill or one lane where possible.
- Describe the trigger scenario the change addresses.
- Link the eval(s) that cover the change.
