# PH2-004: Provision low-cost multiplayer infrastructure

- Status: planned
- Owner: docs-delivery
- Branch: `docs-delivery/phase-2-infrastructure`
- Dependencies: PH2-001, PH2-003, PH1-003
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [ ] Define API Gateway HTTP/WebSocket, .NET 10 Lambda, and DynamoDB resources.
- [ ] Use least-privilege IAM, encryption, throttling, logs, alarms, and useful outputs.
- [ ] Add CDK assertions and a clean synth.
- [ ] Document cost, deployment, rollback, recovery, and teardown.

## Implementation notes

Account, region, environment, origins, and retention are parameters; do not
hardcode personal identifiers.

## Automated/manual evidence

- Pending: CDK tests and `npm run infra:synth`.

## Documentation impact

Backend operations, security, observability, and cost guidance.

## Commit or PR

Pending.

## Risks/follow-ups

- WebSocket stale-connection cleanup and log cost need explicit policy.
