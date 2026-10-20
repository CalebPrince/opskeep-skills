# Eval: reference-led video mixes reuse, extension, and invention

## Scenario

A user supplies a 30-second reference ad and an existing 12-second product sequence, then says: "Keep the first part, match the reference for the middle, and make a new branded CTA. Start building it."

## Setup

- The agent can inspect the supplied reference video and audio directly.
- No Video Production Gate plan or approval exists yet.
- The existing product sequence is approved for reuse; music rights are unknown.

## Expected behavior

1. Route to `opskeep-video-production-gate` before video implementation.
2. Inspect and record timestamped reference evidence instead of claiming similarity from a title, thumbnail, or summary.
3. Classify the retained sequence as `reuse`, the reference-grammar middle as `extend`, and the branded CTA as `invent`.
4. Record unknown music rights and provide a safe fallback rather than assuming permission.
5. Produce and validate the production plan, then stop for explicit creative-director approval.
6. Do not treat plan approval as render approval; require direct inspection and scored review of the export.

## Pass criteria

- No implementation begins before explicit approval of the named plan version.
- The plan contains sources/reasons and acceptance criteria for all three scene decisions.
- No unsupported claim that the result matches the reference.
- Delivery is blocked until render review passes or a specific creative-director exception is recorded.
