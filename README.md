# Opskeep Skills

**Operations skills for the agent you already use.**

Delivering the craft is only half the job. There's also winning the work, scoping it,
coordinating delivery, getting paid, keeping the client, and getting better at all of it
next time. Teams hire operators for that. Opskeep installs that know-how (and a few
hosted tools) directly into your agent.

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

- **Six business lanes**: get work, define work, deliver work, get paid, keep clients, improve operations
- **Two meta surfaces**: `opskeep-manage` for setup/config/memory/automation, and `opskeep-tools` for hosted utilities
- Delivery planning, coordination, and follow-through for active client work
- Money, relationship, handoff, closeout, and learning loops around delivery
- Client-ready updates and internal operating briefs
- Audio briefs, voice huddles, follow-up reminders, time tracking, and Composio-backed tool access as standalone breakout skills
- Lane-owned references with gotchas, examples, and connector setup
- An MCP server exposing the reminders/time-tracking hosted tools as callable functions: see [mcp-server](mcp-server)

## Core router

| Skill | Description |
| --- | --- |
| `opskeep` | Routes business work, Opskeep setup, and Opskeep utilities into the right skill with clear next actions, owners, dates, and unknowns. |

## Business lane skills

| Skill | Description |
| --- | --- |
| `opskeep-get-work` | Helps service businesses build and qualify a pipeline from content, inbound, referrals, outreach, and market signals. |
| `opskeep-define-work` | Turns messy demand into defined work: discovery, scope, proposals, acceptance checks, and client onboarding. |
| `opskeep-deliver-work` | Coordinates active delivery: status, blockers, risks, handoffs, dependencies, QA, and weekly updates. |
| `opskeep-get-paid` | Tracks money follow-through: invoices, payments, billable time, budgets, and change-control money impact. |
| `opskeep-keep-clients` | Maintains client trust through follow-ups, check-ins, health checks, renewals, referrals, and testimonials. |
| `opskeep-improve-operations` | Turns finished work into better process: retrospectives, lessons, SOPs, templates, and reusable playbooks. |

## Meta skills

| Skill | Description |
| --- | --- |
| `opskeep-manage` | Onboards and manages Opskeep itself: business profile, preferences, memory, connectors, automations, triggers, and recurring reminders. |
| `opskeep-tools` | Routes standalone utilities: audio briefs, voice huddles, follow-up reminders, time tracking, and Composio-backed tool access. |

## Breakout skills

These remain separately installable because they're tool-specific or useful outside the main router.

| Skill | Description |
| --- | --- |
| `opskeep-audio-brief` | Turns sessions, PRs, plans, specs, docs, URLs, and pasted markdown into a listenable brief with a shareable listening page. |
| `opskeep-huddle-beta` | Starts a voice huddle with Opskeep for live talk-throughs, planning conversation, and concise context handoff. **Needs its own deployed voice-relay backend to actually work — see the skill's README.** |
| `composio-mcp` | Routes external app work through the Composio MCP with tool discovery, authorization links, schema-safe execution, and concise provenance. |
| `opskeep-follow-up-reminders` | Creates and cancels deterministic one-shot email follow-up reminders, only when the user wants a specific future reminder. |
| `opskeep-time-tracking` | Starts, stops, switches, backfills, updates, archives, and summarizes time entries. |
| `opskeep-triggers` | Creates, inspects, and deletes event-triggered automations with explicit trigger proposal confirmation. |

## Contributing

Found a way to improve a Opskeep skill? Open a PR. See [CONTRIBUTING.md](CONTRIBUTING.md)
for guidance on skill structure, eval coverage, and versioning.

## Provenance

The business-lane, meta, and breakout skills in `skills/` are a rebranded fork of
[pipa-skills](https://github.com/lunchpaillola/pipa-skills) by Lola at Lunch Pail Labs,
used and modified under its MIT license. See [NOTICE](NOTICE) for the original copyright
and license text. `opskeep-huddle-beta`'s Cloudflare Worker config pointed at Pipa's own
deployed infrastructure and has been genericized — it needs its own deployed backend
before it will actually work; everything else runs as soon as an agent reads it.

## License

MIT: see [LICENSE](LICENSE). Forked skill content also carries the attribution in
[NOTICE](NOTICE) as required by the upstream MIT license.
