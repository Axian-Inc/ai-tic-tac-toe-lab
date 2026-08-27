# CI/CD Agent Instructions

These instructions apply below `.github/`. The documentation/delivery agent
owns this area, and the repository root `AGENTS.md` also applies.

## Pull Request Validation

Build workflows around the stable root command contract. Required checks are:

- client unit tests;
- server unit tests;
- integration tests;
- Playwright acceptance tests;
- coverage generation and threshold enforcement;
- production build/package;
- CDK synthesis;
- documentation/link checks.

Use dependency caching keyed by lockfiles, pin actions to stable major or
immutable versions according to repository policy, apply least-privilege
workflow permissions, add concurrency cancellation for superseded PR runs, and
upload coverage plus failure diagnostics as artifacts.

The validation workflow must run for pull requests whose base branch is
`zebanaya-kepler`.

## Integration Branch Trigger

Every merge into `zebanaya-kepler` produces a push to that branch and must
trigger CI/CD. Configure the workflow with an explicit push filter equivalent
to:

```yaml
on:
  pull_request:
    branches: [zebanaya-kepler]
  push:
    branches: [zebanaya-kepler]
```

The push run repeats the complete verification suite against the merged commit
before any delivery job proceeds. Do not rely only on the pull-request run,
because the actual integration commit must be validated.

## Deployment

- PR workflows must never deploy.
- The `zebanaya-kepler` push workflow is the post-merge CI/CD entry point. Its
  delivery job may deploy to the Axian L&D environment only after verification
  succeeds and any configured protected-environment approval is granted.
- Prefer GitHub OIDC and short-lived AWS roles over stored access keys.
- Surface the AWS account, region, stack names, commit SHA, and deployment URL
  in deployment summaries.
- Do not add production or shared-account mutation without explicit approval.
