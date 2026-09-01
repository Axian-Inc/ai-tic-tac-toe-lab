# FND-001: Define shared contracts and terminology

- Status: done
- Owner: coordinator
- Branch: `coordinator/phase-2-contracts`
- Dependencies: none
- Requirement source: `docs/agent-orchestration-plan.md`

## Acceptance criteria

- [x] Define game status, player marks, result vocabulary, and board coordinates.
- [x] Approve HTTP operations, WebSocket envelope/versioning, and error semantics.
- [x] Approve root commands and golden rule-vector format.

## Implementation notes

Phase 1 domain and CPU semantics are frozen in `contracts/game-domain.md` and
the version 1 rule vectors. Phase 2 lifecycle, HTTP, WebSocket, replay,
idempotency, abandonment, and capacity semantics are frozen in
`contracts/multiplayer-domain.md`, `contracts/openapi.yaml`, and
`contracts/websocket-events.md`.

## Automated/manual evidence

- Phase 1 rule-vector schema/reference checks and all contract-vector tests
  passed in the merged Phase 1 verification run.
- Phase 2 contract examples and references are validated in CI before server,
  client, quality, and infrastructure changes integrate.

## Documentation impact

Update contract references and relevant ADR statuses.

## Commit or PR

PR #22 established Phase 1; the Phase 2 contract PR is recorded when merged.

## Risks/follow-ups

- Future contract versions require coordinator review and compatibility notes.
