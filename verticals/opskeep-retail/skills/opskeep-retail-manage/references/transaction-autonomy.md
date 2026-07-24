# Opskeep Retail Transaction Autonomy

Use for setting up, changing, or explaining how much a shop lets the agent complete a
sale on its own, versus holding every message for review.

## Mental Model

Two modes, set per shop during setup and changeable any time:

- **`approval_required`** (default). Every lane skill drafts customer-facing messages,
  quotes, and orders, and holds them for the shop owner's explicit approval before
  anything sends. This is the behavior described everywhere else in this pack unless
  autonomy mode is explicitly on.
- **`autonomous_with_escalation`**. The agent can complete a routine sale end-to-end
  (quote using already-approved pricing, send a payment link, confirm the order) without
  holding for per-message approval. If it hits something outside that authorization, it
  routes to `opskeep-escalate-to-owner` instead of guessing.

Autonomy mode does not remove approval gates everywhere. It only covers routine,
already-priced, in-policy sales through `opskeep-retail-sell`. Refunds, exchanges, bill
payments (`opskeep-retail-get-paid`), pricing/markdown changes
(`opskeep-retail-plan-drop`), and purchase orders (`opskeep-retail-stock-up`) still
require explicit approval regardless of this setting, unless the shop explicitly extends
autonomy to one of those lanes too (ask, don't assume).

## Setup Workflow

1. Confirm which lane(s) autonomy applies to. Default scope if the user just says
   "let it handle sales itself": `opskeep-retail-sell` only.
2. Confirm the escalation triggers that apply (see below); accept shop-specific
   additions.
3. Confirm a value threshold above which any order escalates regardless of confidence.
4. Confirm who gets escalations and how to reach them (phone, WhatsApp number, email) —
   this becomes the `ownerContact` used by `opskeep-escalate-to-owner`.
5. State the setting change plainly before applying it: which lane(s), which triggers,
   who gets escalated to.
6. Require explicit confirmation before turning autonomous mode on. This is a real
   change in what the agent is allowed to do without asking; treat it with the same care
   as connecting a new tool.

## Escalation Triggers (default set)

A lane skill operating in autonomous mode routes to `opskeep-escalate-to-owner` when:

- The customer asks for a price or terms different from what's already approved
  (a discount, a bundle, payment terms outside the norm).
- The request is ambiguous enough that the agent isn't confident what the customer
  actually wants.
- The customer expresses a complaint or dispute.
- The order value is above the shop's configured threshold.
- Nothing above applies, but the agent's confidence in the right next message is
  genuinely low.

Shops can add triggers (e.g. a specific product line that always needs a human) but
cannot remove the defaults above without explicit, stated confirmation that they
understand what they're turning off.

## Output Contract

- Current autonomy setting per lane, or `TBD` if never configured (defaults to
  `approval_required`).
- Escalation triggers in effect.
- Value threshold.
- Owner escalation contact.
- Confirmation gate before turning autonomous mode on or widening its scope.

## Rules

- Default to `approval_required` for every lane unless the shop has explicitly turned
  autonomy on for a specific lane.
- Never widen autonomy scope (new lane, removed trigger, raised threshold) without
  explicit confirmation restating exactly what's changing.
- Do not claim autonomy mode guarantees a live WhatsApp handoff on escalation — that
  depends on the connected channel's own capability. See
  `skills/opskeep-escalate-to-owner/SKILL.md` for how that's actually checked.
