---
name: opskeep-escalate-to-owner
description: Pause an autonomous, in-progress customer conversation and bring the business owner in, either through a live same-thread handoff (when the connected channel supports it, e.g. WhatsApp Business API conversation takeover) or by notifying the owner and pausing the transaction (when it doesn't). Use only when a lane skill operating in autonomous mode hits something outside its authorization: a price deviation, an ambiguous request, a dispute or complaint, a high-value order, or low confidence. Do not use for routine questions a lane skill can answer on its own, and do not use when the business is running in the default approval-required mode (there, the lane skill just holds the draft for review instead).
lane: meta
metadata:
  version: 0.1.0
---

# Opskeep Escalate To Owner

Bring the business owner into an in-progress customer conversation when an
autonomously-operating agent shouldn't decide alone.

This only applies to a business running in `autonomous_with_escalation` mode (set in
`opskeep-manage`/`opskeep-retail-manage`/etc.). In the default `approval_required` mode,
lane skills already hold every draft for review — this skill has nothing to do there.

## Workflow

1. **Confirm this is a real escalation trigger.** One of: price/terms deviation from what's
   already approved, an ambiguous request the agent can't confidently resolve, a dispute
   or complaint, an order above the business's configured value threshold, or genuinely
   low confidence in what to say next. Do not escalate routine questions a lane skill can
   answer from already-approved pricing/policy.

2. **Check whether live handoff is possible.** Through `composio-mcp` discovery, check
   whether the connected channel for this conversation (e.g. a WhatsApp Business API
   connection) exposes a conversation-claim/takeover/assign-to-human operation.

   - Live handoff requires the actual WhatsApp Business **API** tier through a connected
     provider, not the free consumer WhatsApp Business app (which caps at 5 linked
     devices and has no takeover capability). Do not assume it's available; verify
     through discovery.
   - If a claim/takeover/transfer operation is available and connected, use it: stop the
     agent's automated responses on that thread and hand it to the owner with full
     conversation context, exactly where the customer already is. This is the ideal
     outcome and matches "the client continues the conversation."

3. **If live handoff isn't available, fall back to notify-and-pause.** Call
   `escalate_to_owner` (summary, conversation reference, reason, owner contact). This
   records the escalation and pauses that specific transaction. Tell the customer-facing
   side of the conversation to hold (a brief, honest "let me check on that" style message
   is fine; do not fabricate a timeline you don't know).

   Be plain with the business owner about delivery: the current scaffold records the
   escalation but does not yet deliver a real SMS/WhatsApp/push notification to them (see
   `mcp-server/src/tools/escalations.js`). Say so if asked whether they'll actually be
   pinged.

4. **On resolution**, call `resolve_escalation` with how it was handled:
   `owner_handled` (owner took over directly), `proceed_as_drafted` (owner approved the
   agent's plan, agent resumes), or `cancelled`.

## Output Contract

- Escalation reason and the specific trigger.
- Conversation reference.
- Handoff method used: live takeover, or notify-and-pause.
- Current status: pending or resolved, with resolution if resolved.
- What the customer-facing side was told while paused.

## Boundaries

- Never invent that a live handoff happened if the connected toolkit doesn't actually
  support it. Verify through `composio-mcp` discovery, don't assume.
- Never claim an owner was notified unless a real delivery mechanism was used. The
  current scaffold does not deliver real notifications; say so.
- This skill does not decide business questions (pricing, policy). It only pauses and
  routes the decision to the owner.

## Gotchas

- A live-handoff-capable connection can still fail at claim time (owner not available,
  provider error). Fall back to notify-and-pause rather than leaving the customer
  waiting indefinitely.
- One escalation covers one paused transaction. Resolving it does not change the
  business's autonomy setting or grant standing permission for similar future cases.
