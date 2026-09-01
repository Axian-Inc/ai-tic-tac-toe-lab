# CI/CD Setup and Operation

## Trigger model

`Validate` runs for pull requests into and pushes to `zebanaya-kepler`. The
push run validates the actual integrated commit. Its delivery job depends on
successful verification of that same SHA.

Pull requests never deploy. Delivery is deliberately skipped until enabled.

## Current Phase 1 state

The push workflow for merged commit `1185521` completed `Full verification`
successfully on 2026-08-28, including .NET 10, unit/component/CDK tests,
Playwright, coverage, build, and synthesis. `Deploy approved integration build`
was skipped because `ENABLE_AWS_DEPLOYMENT` was not true for that run. No
deployment URL or AWS resource evidence has been recorded.

## Repository configuration

An administrator should:

1. Protect `zebanaya-kepler`; require pull requests and the `Full verification`
   check, and restrict direct pushes to the integration coordinator if needed.
2. Create a protected GitHub environment named `axian-lnd` with required
   reviewers.
3. Add environment or repository variable `ENABLE_AWS_DEPLOYMENT=true` only
   when automatic post-merge delivery is authorized.
4. Add `AWS_DEPLOY_ROLE_ARN`, `AWS_ACCOUNT_ID`, and optional `AWS_REGION` and
   `RETAIN_DATA` variables. The region defaults to `us-west-2`; retention
   defaults to `true`.
5. Configure the named AWS role to trust GitHub OIDC only for this repository,
   integration branch, and environment; give it only stack-required actions.

Do not configure static `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` secrets
for these workflows.

## Validation contract

The root workspace owns `package-lock.json` and implements `npm run verify`.
That command includes lint/type checks, client and
server tests, integration/Playwright tests, coverage generation, production
build/package, and CDK synthesis. CI installs Chromium and .NET 10 first.

Coverage is retained for 14 days. Failed Playwright diagnostics are retained
for 7 days. Neither output belongs in Git.

## Delivery contract

`npm run infra:deploy` verifies the current AWS account, then deploys the
application and CDK stacks for `DEPLOY_ENVIRONMENT=lnd`, surfaces stack names
and URLs, and fails rather than partially reporting success. Phase 2 delivery
first deploys the backend, captures the HTTP/WebSocket outputs, rebuilds the
Vite workspace using the application-approved `VITE_` variable names, and then
deploys the web stack. The protected environment must configure the approved
Lambda artifact/handler seams, explicit allowed origins, and exact client
variable names described in the Phase 2 backend runbook; synthesis-only
placeholders are rejected by the deploy guard.

Before approving a run, confirm the commit, intended AWS account, region,
change set, and rollback owner. Afterward, record the workflow URL and deployed
URL on the applicable ticket.

See [Phase 2 AWS multiplayer backend](phase-2-aws-backend.md) for backend
access patterns, security, first-deploy sequencing, recovery, capacity
reconciliation, and teardown.

## Recovery

- Verification failure: no delivery begins; use the uploaded diagnostics and
  fix on the owning agent branch.
- Approval denied or delivery skipped: no AWS change occurs; correct variables
  or seek authorization, then rerun the verified workflow.
- Deployment failure: stop automatic retries, inspect CloudFormation events,
  and follow the phase runbook. Do not delete stacks merely to clear a failure.
- Suspected credential exposure: disable the role/session path, notify the AWS
  owner, preserve audit logs, and rotate or revoke affected credentials.
