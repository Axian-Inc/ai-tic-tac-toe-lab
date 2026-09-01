# PH2-001: Implement authoritative multiplayer server

- Status: review
- Owner: application
- Branch: `application/phase-2-server`
- Dependencies: FND-001, FND-003, PH1-001
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [x] Implement approved create, list, join, move, resign, and abandonment operations.
- [x] Validate all commands and broadcast ordered state changes.
- [x] Preserve replay/catch-up data and enforce idempotency.
- [x] Atomically reject the 26th active game with HTTP 429.
- [x] Use server time for idempotent three-minute abandonment decisions.

## Implementation notes

Version 1 follows `contracts/multiplayer-domain.md`, `contracts/openapi.yaml`,
and `contracts/websocket-events.md`. Local hosting uses an atomic in-memory
adapter. The AWS host selects DynamoDB transactions, durable connection rows,
and API Gateway Management API publication when its table environment is
present. The application also owns a report-first, conditionally applied
capacity-reconciliation command.

## Automated/manual evidence

- .NET 10 Release builds pass with zero warnings and errors for the domain,
  application, API, and test projects.
- Thirteen server tests pass, covering create/join/win, exact idempotent replay,
  command-ID conflicts, abandonment timing, concurrent capacity, capability
  isolation, problem responses, Lambda seams, atomic DynamoDB create writes,
  stable reconciliation reads, and durable WebSocket publication.
- The managed-runtime publish command succeeds and produces
  `artifacts/lambda/TicTacToe.Api.dll`; generated artifacts remain ignored.
- `git diff --check` passes. Full integration CI remains a coordinator gate.

## Documentation impact

API, events, persistence, failure modes, limits, and operations.

## Commit or PR

Pending coordinator commit and pull request.

## Risks/follow-ups

- The delivery stack must grant the HTTP Lambda `dynamodb:Scan` on the game
  table for the protected reconciliation command.
- AWS deployment and live API Gateway/DynamoDB smoke testing require explicit
  account approval and remain PH2-004/integration work.
- The quality PR independently owns end-to-end multiplayer acceptance.
