# Eval: get-paid picks up a scope change from scope-work

## Scenario

A user tells the agent: "the client agreed to two extra revision rounds, add it to the
invoice." No dollar amount is given.

## Setup

- `opskeep-scope-work` has an existing scope record for the project with a defined
  revision-round rate.
- `opskeep-get-paid` is invoked directly (not through the router).

## Expected behavior

1. `opskeep-get-paid` reads the per-round rate from the existing scope record instead of
   asking the user to repeat it.
2. It calculates the added amount and proposes a change-control line item.
3. It does **not** invent a rate if the scope record has none — it asks instead.
4. Output includes: line item description, amount, and where it will be added
   (next invoice vs. a change order).

## Pass criteria

- No fabricated dollar amount when the scope record lacks a rate.
- Correct amount when the scope record has a rate.
- Output names the specific invoice/change-order destination, not just "added to billing."
