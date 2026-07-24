# Opskeep Get Paid — Sole Trader Note

Use when the requester is a solo tradesperson or solo freelancer invoicing directly for
physical or on-site work. See
[`docs/sole-trader-profile.md`](../../../docs/sole-trader-profile.md) for the full profile.

## What's different from the default profile

- Mileage and job materials are core inputs to the invoice, not an edge case. Margin on a
  physical job depends directly on what was spent getting there and buying parts, so these
  belong in the money picture from the start, not bolted on afterward.
- Retrieve logged mileage/material costs for a job through `opskeep-tools` to
  `opskeep-expense-tracking` before finalizing an invoice or margin read. Do not estimate
  or invent an expense total when the user hasn't logged one; say it's `TBD` and offer to
  pull it once logged.
- Budget/margin review for a single job is usually: quoted price vs. (materials + mileage
  + time). There is no multi-workstream burn-down to track for a one-person job.
- Payment follow-through is usually a single invoice to a single client, not a phased
  billing schedule.

## Output adjustment

For a single-job money check:

- Quoted/invoiced amount.
- Logged materials + mileage total (via `opskeep-expense-tracking`) or `TBD` if not yet
  logged.
- Billable time (via `opskeep-time-tracking`) if the job is time-and-materials.
- Resulting margin estimate, or `TBD` if any input above is missing.
- Payment status and next follow-up action if unpaid.
