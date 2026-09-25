# Enforcing approval in CI/CD

Documentation alone does not enforce a lock. Use the bundled validator (or an equivalent policy rule) and wire it to protected branches and every production deployment path:

```sh
pip install pyyaml
# every pull request: structure, references, traceability, lifecycle rules
python scripts/validate_baseline.py security-baseline.yaml
# merge / implementation paths
python scripts/validate_baseline.py security-baseline.yaml --require-approved \
  --expected-digest "$APPROVED_DIGEST" --stage PULL_REQUEST
# production deploys
python scripts/validate_baseline.py security-baseline.yaml --require-approved \
  --expected-digest "$APPROVED_DIGEST" --target production --stage PRE_DEPLOY
```

`$APPROVED_DIGEST` must come from a protected source the pull request author cannot edit (see below). Without `--expected-digest` the validator warns that approval is self-asserted. Copy the validator into the project repository and pin it; run `scripts/test_validate_baseline.py` after changing it.

The gate must fail closed when the baseline is missing or malformed; schema/baseline version is unsupported; lifecycle is not `APPROVED`; approval is absent, expired, out of scope, or does not bind the current baseline digest; an approval-blocking decision is unresolved; a required blocking gate lacks acceptable evidence; status is `SUSPENDED`; or production posture is `PRODUCTION_PROHIBITED`.

Do not trust approval metadata added or changed by the same ordinary pull request. Use at least one independently protected source of truth, such as:

- signed approval attestation over the baseline digest;
- protected environment approval tied to the reviewed commit/digest;
- CODEOWNERS plus protected approval record that the author cannot self-approve;
- an external policy/approval service with immutable audit history.

Require the validator as a protected status check, restrict bypass rights, test a denied deployment, and retain logs. Record the enforcement control and evidence in the baseline. If branch or environment protection cannot be inspected, leave the gate `CONFIGURED` rather than `VERIFIED`, and say so; only mark it `VERIFIED` after observing a denied run and linking that evidence.

For SPIKE, CI may allow a named sandbox workflow but must deny production environment targets, production credentials/data, release tags, and promotion jobs.
