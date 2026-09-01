# PH2-004: Provision low-cost multiplayer infrastructure

- Status: review
- Owner: docs-delivery
- Branch: `docs-delivery/phase-2-infrastructure`
- Dependencies: PH2-001, PH2-003, PH1-003
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [x] Define API Gateway HTTP/WebSocket, .NET 10 Lambda, and DynamoDB resources.
- [x] Use least-privilege IAM, encryption, throttling, logs, alarms, and useful outputs.
- [x] Add CDK assertions and a clean synth.
- [x] Document cost, deployment, rollback, recovery, and teardown.

## Implementation notes

Account, region, environment, origins, and retention are parameters; do not
hardcode personal identifiers.

## Automated/manual evidence

- `npm ci --ignore-scripts`: 246 packages installed, zero vulnerabilities.
- `npm run lint --workspace @tic-tac-toe/infra`: passed.
- `npm run test:unit --workspace @tic-tac-toe/infra`: nine Phase 1/2 CDK
  assertion groups passed.
- `WEB_BUILD_PATH=test/fixtures/web npm run infra:synth`: passed without AWS
  credentials or mutation and produced separate backend/web templates.
- Repository-relative `API_PUBLISH_PATH=infra/cdk/test/fixtures/lambda` and the
  default synthesis fixture both passed, proving the deploy and synth path
  resolution is consistent.
- Synthesized change summary: the backend template contains 49 resources and
  eight outputs (including two APIs, two .NET 10 functions, two tables, eight
  alarms, and four log groups); the independent web template contains nine
  resources and six outputs.
- Direct invocation of the delivery script without authorization failed closed
  before AWS access with `Deployment is disabled`; an authorized-looking dry
  run using the synthesis fixture also failed before AWS access with `The
  synthesis-only Lambda fixture cannot be deployed`.
- No AWS deployment, bootstrap, or live diff was performed.

## Documentation impact

Added the Phase 2 backend runbook and updated the operations/CI and CDK
documentation for access patterns, security, observability, cost, two-stage
delivery, verification, rollback, recovery, reconciliation, and teardown.

## Commit or PR

Branch `docs-delivery/phase-2-infrastructure`; commit and PR pending coordinator
handoff acceptance.

## Risks/follow-ups

- PH2-001 supplies `artifacts/lambda`, the `TicTacToe.Api` executable HTTP
  handler, and the class-based WebSocket handler recorded in the runbook.
- PH2-002 supplies `VITE_API_BASE_URL` and `VITE_WS_URL`; the protected
  environment variable-name settings are recorded in the runbook.
- PH2-001 supplies the guarded capacity reconciliation command described in
  the runbook; manual singleton edits are not an acceptable repair path.
- CloudWatch alarms are deliberately actionless until an approved L&D SNS
  destination exists. Logs default to 14 days to bound cost.
