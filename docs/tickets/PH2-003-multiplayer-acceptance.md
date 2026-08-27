# PH2-003: Prove multiplayer behavior

- Status: planned
- Owner: quality
- Branch: `quality/phase-2-multiplayer`
- Dependencies: PH2-001, PH2-002
- Requirement source: `docs/requirements/phase-2.md`

## Acceptance criteria

- [ ] Test commands, wins, resignation, abandonment, idempotency, and replay.
- [ ] Prove concurrent capacity and the 26th-game HTTP 429.
- [ ] Run a complete two-browser multiplayer Playwright game.
- [ ] Run Phase 1 regression and Phase 2 checks together.

## Implementation notes

Use a controlled server clock for abandonment tests.

## Automated/manual evidence

- Pending: server, integration, and Playwright reports.

## Documentation impact

Testing matrix and known timing/concurrency diagnostics.

## Commit or PR

Pending.

## Risks/follow-ups

- Local emulators may not perfectly model DynamoDB transaction behavior.
