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

## Deployment

- PR workflows must never deploy.
- Put deployments in a separate manually approved or protected-environment
  workflow.
- Prefer GitHub OIDC and short-lived AWS roles over stored access keys.
- Surface the AWS account, region, stack names, commit SHA, and deployment URL
  in deployment summaries.
- Do not add production or shared-account mutation without explicit approval.

