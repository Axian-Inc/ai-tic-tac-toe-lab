# FND-001: Define shared contracts and terminology

- Status: in-progress
- Owner: coordinator
- Branch: `coordinator/phase-1-contracts`
- Dependencies: none
- Requirement source: `docs/agent-orchestration-plan.md`

## Acceptance criteria

- [x] Define game status, player marks, result vocabulary, and board coordinates.
- [ ] Approve HTTP operations, WebSocket envelope/versioning, and error semantics.
- [x] Approve root commands and golden rule-vector format.

## Implementation notes

Phase 1 domain and CPU semantics are frozen in `contracts/game-domain.md` and
the version 1 rule vectors. HTTP and WebSocket semantics remain intentionally
open until the Phase 2 contract gate. Documentation may propose designs, but
only the coordinator freezes public contracts.

## Automated/manual evidence

- Phase 1 rule-vector schema/reference checks and all contract-vector tests
  passed in the merged Phase 1 verification run.
- Phase 2 HTTP and WebSocket schemas remain intentionally proposed.

## Documentation impact

Update contract references and relevant ADR statuses.

## Commit or PR

PR #22, merged into `zebanaya-kepler`.

## Risks/follow-ups

- Phase 2 cannot begin until the remaining HTTP and WebSocket decisions close.
- Dependent agents must not invent incompatible schemas.
