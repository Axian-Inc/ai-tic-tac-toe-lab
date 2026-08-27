# FND-004: Establish independent quality harness

- Status: in-progress
- Owner: quality
- Branch: `quality/acceptance`
- Dependencies: FND-001, FND-003
- Requirement source: Phase 1 acceptance criteria

## Acceptance criteria

- [ ] Establish unit, component, server, integration, and Playwright conventions.
- [ ] Keep deterministic fixtures independent of application internals.
- [ ] Make diagnostics and coverage paths compatible with CI artifact upload.

## Implementation notes

Quality may commit a failing acceptance test when its blocked ticket and
expected behavior are explicit.

## Automated/manual evidence

- Pending: harness smoke-test output.

## Documentation impact

Document suite purposes and local debugging.

## Commit or PR

Pending.

## Risks/follow-ups

- Coordinate test dependencies without editing the application-owned lockfile.
