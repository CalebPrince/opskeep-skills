# Opskeep Recurring Reminders

Use for a repeating self-email nudge on a daily, weekly, or monthly cadence: "remind me
every Monday at 9 to send status updates," "nudge me on the 1st of every month to review
invoices," "daily reminder at 5pm to log my time."

## Mental Model

- Not a business lane.
- Not `opskeep-follow-up-reminders`: that skill is one-shot only ("email me tomorrow at
  9"). A cadence word (every, daily, weekly, monthly, each Friday, repeating) means this
  flow instead.
- Not `opskeep-triggers`: that skill reacts to external app events (a PR opening, an issue
  being created). This flow reacts to a clock, not an event.
- `opskeep-manage` owns this because it is Opskeep operating-configuration, not a business
  outcome.

## Required Inputs Before Create

1. Reminder message.
2. Recipient email (default to the verified Opskeep account email when known).
3. Frequency: `daily`, `weekly`, or `monthly`.
4. Local time (24-hour) and IANA timezone.
5. `weekly` additionally needs a day of week. `monthly` additionally needs a day of month.
6. Explicit user confirmation of the full cadence before create.

## Create Workflow

1. Detect recurring-reminder intent (cadence wording, not a single future instant).
2. Extract message, recipient, frequency, time, timezone, and day-of-week/day-of-month as
   needed.
3. Ask one direct question for anything missing or ambiguous (e.g. "which day of the
   week?" or "what timezone?").
4. Confirm the resolved cadence in plain language before creating anything.
5. Call `schedule_recurring_reminder`.
6. Return the rule ID and a plain-language restatement of the cadence.

Confirmation format:

```text
I can set up this recurring reminder:
- Message: "Send status updates"
- Recipient: you@example.com
- Cadence: every Monday at 09:00 (America/New_York)

Should I create it?
```

## List / Cancel Workflow

- List: call `list_recurring_reminders`, default to `status: "active"` unless the user
  asks for all or cancelled rules. Present cadence in plain language, easy to scan.
- Cancel: require a rule ID from the request, conversation, or prior list/create response.
  If missing, list active rules first and ask which one. Call `cancel_recurring_reminder`
  only after the target rule is unambiguous.

There is no update in this flow. Changing a cadence is cancel-then-recreate, same as
`opskeep-triggers`.

## Current Implementation Status

The reference implementation (`mcp-server/src/tools/recurringReminders.js`) is an
open-source scaffold: it stores the cadence rule in memory and does not itself fire any
email. A real scheduler (cron table, queue, etc.) must materialize and send each
occurrence; that piece is a `TODO` in the tool source, same as the one-shot
`schedule_reminder` scaffold. Say so plainly if the user asks whether reminders will
actually arrive: the rule is stored, delivery infrastructure is not yet wired up in the
open-source path.

## Output Contract

- Cadence in plain language (frequency, day if applicable, time, timezone).
- Recipient.
- Rule ID after create.
- Confirmation gate before create or cancel.
- Honest status note if delivery infrastructure is not connected.

## Gotchas

- A bare future instant ("remind me tomorrow at 9") is one-shot, not recurring. Route to
  `opskeep-follow-up-reminders` instead.
- An external-app event ("when a PR opens") is not this flow. Route to `opskeep-triggers`.
- Do not invent a day-of-week or day-of-month when the user says "weekly" or "monthly"
  without specifying one; ask.
