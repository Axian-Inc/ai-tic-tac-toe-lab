# PH2-001: Implement authoritative multiplayer server

- Status: ready
- Owner: application
- Branch: `application/phase-2-server`
- Dependencies: FND-001, FND-003, PH1-001
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [ ] Implement approved create, list, join, move, resign, and abandonment operations.
- [ ] Validate all commands and broadcast ordered state changes.
- [ ] Preserve replay/catch-up data and enforce idempotency.
- [ ] Atomically reject the 26th active game with HTTP 429.
- [ ] Use server time for idempotent three-minute abandonment decisions.

## Implementation notes

Implement version 1 exactly as frozen in `contracts/multiplayer-domain.md`,
`contracts/openapi.yaml`, and `contracts/websocket-events.md`.

## Automated/manual evidence

- Pending: `npm run test:server` and integration results.

## Documentation impact

API, events, persistence, failure modes, limits, and operations.

## Commit or PR

Pending.

## Risks/follow-ups

- Count-then-create is invalid under concurrency.
