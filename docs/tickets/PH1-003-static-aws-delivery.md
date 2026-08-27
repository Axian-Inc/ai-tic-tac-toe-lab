# PH1-003: Deliver Phase 1 static application

- Status: review
- Owner: docs-delivery
- Branch: `docs-delivery/phase-1-aws`
- Dependencies: FND-002, FND-003, PH1-001, PH1-002
- Requirement source: `docs/requirements/phase-1.md`

## Acceptance criteria

- [x] Define private S3 and HTTPS CloudFront resources with CDK assertions.
- [x] Parameterize environment, account, region, and retention behavior.
- [x] Document bootstrap, synth, approved deploy, verification, rollback, teardown, and cost drivers.
- [ ] Record the verified deployment URL only after explicit AWS approval.

## Implementation notes

Synth must not mutate AWS. Deployment defaults to disabled. The asset bucket
is retained by default; destructive L&D cleanup is explicit and guarded.

## Automated/manual evidence

- `npm run lint --workspace @tic-tac-toe/infra`: passed.
- `npm run test:unit --workspace @tic-tac-toe/infra`: four CDK assertion
  scenarios passed for security, routing, deployment, outputs, and retention.
- Fixture-backed `npm run infra:synth`: produced
  `TicTacToe-lnd-Web.template.json` with one S3 bucket/policy, OAC,
  distribution, and deployment resource plus six documented outputs.
- Pending: approved deployment workflow, URL, deployed Playwright result, and
  named account/region evidence.

## Documentation impact

Added ADR-007, the Phase 1 AWS runbook, CI guard configuration, README command
and cost guidance, and Codex getting-started evidence expectations.

## Commit or PR

Pending.

## Risks/follow-ups

- Account permissions and CDK bootstrap state require confirmation.
- The first deployment uses the generated CloudFront domain; custom
  DNS/certificate scope remains future work.
- `package-lock.json` changes add the explicitly approved infrastructure
  workspace dependencies.
