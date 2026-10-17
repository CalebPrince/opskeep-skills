---
name: opskeep-accounting-manage
description: "Use when the user wants to set up or operate Opskeep Accounting itself: practice profile (country, currency, timezone, services), client roster with entity type, year-end, registrations and accounting software per client, deadline rules, chase and materiality preferences, sign-off policy, and connecting accounting software (QuickBooks, Xero, Sage, Zoho Books, Tally) or checking what Opskeep Accounting can access."
metadata:
  lane: meta
  version: 0.1.0
---

# Opskeep Accounting Manage

Set up the practice context every other accounting lane reads from.

## Use For

- Practice profile: name, country, base currency, timezone, services offered, staff and
  who can sign off.
- Client roster: per client entity, the fields below.
- Deadline rules per client (entered by the practice or verified from an official
  source), used by `opskeep-accounting-deadlines`.
- Preferences: records due date, chase ladder spacing, deadline warning window,
  materiality threshold, stale reconciling-item threshold.
- Connecting accounting software and checking access.

## References

- Load `references/practice-profile.md` for the roster fields, preferences and
  connector checks.

## Output Contract

- What was recorded or changed, field by field.
- What's still `TBD` and which lane it blocks.
- Connector status: connected / not connected / unknown, and what each allows (read or
  write).

## Boundaries

- Store what the user gives. Don't fill a registration, year-end or deadline rule from
  memory; mark it `TBD`.
- Connector setup and status live here. Live reads/writes go through `opskeep-tools`/
  `composio-mcp`.
- Default every connector to read-only use. Writes (journals, recategorisation, period
  lock) need the user's explicit opt-in here and still need per-batch approval in
  `opskeep-accounting-close`.

## Gotchas

- Client tax identification numbers, bank account numbers and identity document numbers
  are sensitive. Record that they're on file, not the numbers themselves, unless the
  user explicitly wants them stored and the store is theirs.
- Ask for one missing field at a time, starting with the one blocking the user's current
  request.
