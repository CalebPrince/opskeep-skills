---
name: opskeep-accounting-deadlines
description: "Use when an accounting or bookkeeping practice needs to see or manage client compliance deadlines: a per-client or practice-wide calendar of tax, VAT/sales-tax, payroll, withholding, annual return and statutory accounts due dates, what's due in the next few weeks, what's overdue, and the prep status and owner for each."
metadata:
  lane: deadlines
  version: 0.1.0
---

# Opskeep Accounting Deadlines

Make sure no client filing is a surprise.

## Use For

- Practice-wide "what's due in the next 30 days" view.
- One client's full compliance calendar for the year.
- Overdue items with what's blocking them.
- Adding or changing a deadline rule for a client (for example a new VAT registration).

## References

- Load `references/deadlines.md` for where dates come from, the calendar format and the
  urgency rules.
- Load `references/ghana.md` when the client is in Ghana: obligation areas to confirm,
  which body owns each, and how to record rule versions. No dates or rates.

## Output Contract

- Each deadline: client, obligation, period covered, due date, source of the date,
  prep status, owner, blocker.
- Sorted by due date, overdue first.
- Every due date cites where it came from (practice calendar, user, or official source
  with the date checked). No source -> `TBD`, never a remembered date.

## Boundaries

- This lane tracks and prepares. It never files, submits or pays anything to an authority.
- Statutory dates, rates and thresholds are not shipped in this pack. They come from the
  practice's calendar, the user, or an official source looked up and cited at the time.
- Missing records behind a deadline -> `opskeep-accounting-collect`.
- Recurring reminders ahead of each deadline -> core `opskeep-manage`; a one-off reminder
  -> `opskeep-tools` to `opskeep-follow-up-reminders`.

## Gotchas

- Due dates that fall on a weekend or public holiday may move under local rules. Flag it
  as `Check rule` rather than shifting the date yourself.
- When a client's registrations are unknown (for example whether they're VAT registered),
  list the obligation as `TBD: confirm registration`, don't drop it or assume it.
- Express dates in the practice's timezone from `opskeep-accounting-manage`.
