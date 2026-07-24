# Opskeep Define Work — Sole Trader Note

Use when the requester is a solo tradesperson or solo freelancer (electrician, plumber,
mobile hairdresser, personal trainer, freelance designer, handyman, and similar), not a
multi-person agency or consultancy. See [`docs/sole-trader-profile.md`](../../../docs/sole-trader-profile.md)
for the full profile this note is drawn from.

## What's different from the default profile

- A quote for a single job is the whole scoping artifact. Don't inflate it into a
  multi-section proposal unless the job is genuinely large or multi-phase.
- Skip RACI/stakeholder mapping (`references/plan-raid-raci-decision-setup.md`) unless the
  client explicitly has more than one decision-maker (e.g., a landlord and a tenant, a
  couple who both need to sign off). A single homeowner or single point of contact doesn't
  need a stakeholder matrix.
- Acceptance checks are usually simple and physical: the job is done, the client walked
  it, they're satisfied. Don't manufacture formal sign-off steps a one-person shop
  wouldn't actually use.
- Materials and travel are part of the quote, not an afterthought. Capture them as line
  items in the working brief so `opskeep-get-paid` has them at invoicing time.

## Output adjustment

Keep the working brief to what a single job actually needs:

- Job description and location.
- Materials/parts needed (rough list is fine; exact costs land at invoicing).
- Quoted price or estimate range, and what's excluded.
- Scheduled date/window, if known.
- One decision needed (if any) and `TBD` for anything genuinely unknown.

Don't add sections (stakeholder map, phased roadmap, formal acceptance criteria) that
exist for team-based engagements but add nothing for a single job with a single client.
