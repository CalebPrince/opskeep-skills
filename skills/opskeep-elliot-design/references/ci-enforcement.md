# Enforcing approval in CI/CD

Documentation alone does not enforce a lock. Use the bundled validator (or an equivalent policy rule) and wire it to protected branches and every production deployment path.

```sh
pip install pyyaml            # pin the version in real pipelines
# every pull request: structure, references, traceability, domain coverage, lifecycle rules
python scripts/validate_baseline.py security-baseline.yaml --strict-warnings
# merge / implementation paths
python scripts/validate_baseline.py security-baseline.yaml --require-approved \
  --expected-digest "$APPROVED_DIGEST" --target development --stage PULL_REQUEST
# staging and production deploys
python scripts/validate_baseline.py security-baseline.yaml --require-approved \
  --expected-digest "$APPROVED_DIGEST" --target production --stage PRE_DEPLOY
```

## What the gate now enforces (schema 2.2)

- **A protected digest is mandatory.** `--require-approved` fails unless `--expected-digest` (or `$EXPECTED_BASELINE_DIGEST`) is supplied. `--allow-self-asserted` exists for local experiments only; it prints a warning and must never appear in a pipeline.
- **The digest binds the approval scope and every weakening state.** Widening `approval.scope`, retiring a control, marking it `NOT_APPLICABLE`, disabling a gate, or accepting a threat changes the digest, so the gate fails against the protected value. Pure progress (`PLANNED` to `IMPLEMENTED`, recording CI evidence) does not.
- **Environments are explicit.** `--target production` requires an `approval.scope` entry that starts with `production`; `staging` and `development` work the same way. Free-text scope is rejected at lint time.
- **A SPIKE can only target `development`**, and an expired SPIKE fails validation.
- The gate fails closed when the baseline is missing, malformed or unreadable (exit 2), the schema is unsupported, the lifecycle is not `APPROVED`, approval is absent or expired, an approval-blocking decision or control is unresolved, a blocking gate lacks `PASSED` evidence up to `--stage`, the status is `SUSPENDED`, or the production posture is `PRODUCTION_PROHIBITED`.

## Where the protected digest comes from

`$APPROVED_DIGEST` must come from a source the pull request author cannot edit. Choose at least one:

- a signed approval attestation over the digest, verified in the pipeline;
- an environment-scoped variable on a protected deployment environment that requires reviewers and restricts deployment branches (on GitHub, an environment variable referenced only by the deploy job);
- CODEOWNERS plus a protected approval record the author cannot self-approve;
- an external policy or approval service with immutable audit history.

Whoever can edit that source can change what "approved" means, so limit it to the owner, log changes, and record the enforcement control and its evidence in the baseline.

## The validator is part of the trust base

An ordinary pull request that can edit `scripts/validate_baseline.py` or the workflow file can weaken the gate itself. Protect those files the same way as the baseline:

- pin the validator in the repository, require owner review for changes to it and to the workflow (CODEOWNERS plus required reviews), or run the check from a separately protected repository or reusable workflow;
- run `scripts/test_validate_baseline.py` whenever the validator changes;
- pin third-party actions to full commit SHAs and give the workflow least-privilege token permissions.

Example shape (adapt names; pin every action to a reviewed full commit SHA):

```yaml
name: baseline-gate
on: [pull_request]
permissions: {contents: read}
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<full-commit-sha>
      - run: pip install pyyaml==<pinned-version>
      - run: python scripts/validate_baseline.py security-baseline.yaml --strict-warnings
  gate:
    needs: lint
    runs-on: ubuntu-latest
    environment: production        # required reviewers and branch restrictions are configured here
    steps:
      - uses: actions/checkout@<full-commit-sha>
      - run: pip install pyyaml==<pinned-version>
      - env:
          EXPECTED_BASELINE_DIGEST: ${{ vars.APPROVED_BASELINE_DIGEST }}
        run: python scripts/validate_baseline.py security-baseline.yaml --require-approved --target production --stage PRE_DEPLOY
```

## Evidence and status

Require the validator as a protected status check, restrict bypass rights, test a denied deployment, and retain logs. If branch or environment protection cannot be inspected, leave the gate `CONFIGURED` rather than `VERIFIED`, and say so; only mark it `VERIFIED` after observing a denied run and linking that evidence.

For SPIKE, CI may allow a named sandbox workflow but must deny production environment targets, production credentials/data, release tags, and promotion jobs.
