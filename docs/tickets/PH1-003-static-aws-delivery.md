# PH1-003: Deliver Phase 1 static application

- Status: planned
- Owner: docs-delivery
- Branch: `docs-delivery/phase-1-aws`
- Dependencies: FND-002, FND-003, PH1-001, PH1-002
- Requirement source: `docs/requirements/phase-1.md`

## Acceptance criteria

- [ ] Define private S3 and HTTPS CloudFront resources with CDK assertions.
- [ ] Parameterize environment, account, region, and retention behavior.
- [ ] Document bootstrap, synth, approved deploy, verification, rollback, teardown, and cost drivers.
- [ ] Record the verified deployment URL only after explicit AWS approval.

## Implementation notes

Synth must not mutate AWS. Deployment defaults to disabled.

## Automated/manual evidence

- Pending: `npm run infra:synth`, CDK assertions, and approved deployment evidence.

## Documentation impact

AWS operations runbook and README deployment section.

## Commit or PR

Pending.

## Risks/follow-ups

- Account permissions and DNS/certificate scope require confirmation.
