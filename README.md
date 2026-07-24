# Opskeep Skills

**Operations skills for the agent you already use.**

Delivering the craft is only half the job. There's also winning the work, scoping it,
coordinating delivery, getting paid, keeping the client, and getting better at all of it
next time. Teams hire operators for that. Opskeep installs that know-how — and a few
hosted tools — directly into your agent.

Opskeep skills give agents practical operator workflows for service-business work:
pipeline signals, discovery briefs, delivery updates, blockers, invoicing follow-through,
client relationships, closeout notes, retros, and a couple of hosted utilities.

Independent, open-source project.

## Install

```bash
# Install the full skill pack
npx skills add CalebPrince/opskeep-skills

# Or install a single skill
npx skills add CalebPrince/opskeep-skills --skill opskeep

# List every available skill
npx skills add CalebPrince/opskeep-skills --list
```

To update later:

```bash
npx skills update CalebPrince/opskeep-skills
```

### Clone instead

```bash
git clone https://github.com/CalebPrince/opskeep-skills.git
cp -r opskeep-skills/skills/* .agents/skills/
```

## What Opskeep adds

- **Six business lanes** — win work, scope work, run work, get paid, keep clients, sharpen the craft
- **Two meta surfaces** — `opskeep-manage` for setup/config/memory/automation, and `opskeep-tools` for hosted utilities
- Delivery planning, coordination, and follow-through for active client work
- Money, relationship, handoff, closeout, and learning loops around delivery
- Client-ready updates and internal operating briefs
- Session recaps: turn sessions, plans, PRs, and docs into a listenable brief
- Lane-owned references with gotchas, examples, and connector setup

## Core router

| Skill | Description |
| --- | --- |
| `opskeep` | Routes business work, Opskeep setup, and Opskeep utilities into the right skill with clear next actions, owners, dates, and unknowns. |

## Business lane skills

| Skill | Description |
| --- | --- |
| `opskeep-win-work` | Helps service businesses build and qualify a pipeline from content, inbound, referrals, outreach, and market signals. |
| `opskeep-scope-work` | Turns messy demand into defined work: discovery, scope, proposals, acceptance checks, and client onboarding. |
| `opskeep-run-work` | Coordinates active delivery: status, blockers, risks, handoffs, dependencies, QA, and weekly updates. |
| `opskeep-get-paid` | Tracks money follow-through: invoices, payments, billable time, budgets, and change-control money impact. |
| `opskeep-keep-clients` | Maintains client trust through follow-ups, check-ins, health checks, renewals, referrals, and testimonials. |
| `opskeep-sharpen-craft` | Turns finished work into better process: retrospectives, lessons, SOPs, templates, and reusable playbooks. |

## Meta skills

| Skill | Description |
| --- | --- |
| `opskeep-manage` | Onboards and manages Opskeep itself: business profile, preferences, memory, connectors, automations, and triggers. |
| `opskeep-tools` | Routes standalone utilities: session recaps, follow-up reminders, time tracking, and future hosted tools. |

## Contributing

Found a way to improve a Opskeep skill? Open a PR. See [CONTRIBUTING.md](CONTRIBUTING.md)
for guidance on skill structure, eval coverage, and versioning.

## License

MIT — see [LICENSE](LICENSE).
