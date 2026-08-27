# PH3-002: Prove spectator behavior and enforce coverage

- Status: planned
- Owner: quality
- Branch: `quality/phase-3-spectator-coverage`
- Dependencies: PH3-001, PH2-003
- Requirement source: `docs/requirements/phase-3.md`

## Acceptance criteria

- [ ] A third browser joins mid-game, catches up, and receives later moves.
- [ ] Tests prove spectator commands are rejected.
- [ ] `npm run coverage` emits client and server reports and enforces approved thresholds.

## Implementation notes

Thresholds should prioritize game/server behavior and be approved before they
become a merge gate.

## Automated/manual evidence

- Pending: Playwright and coverage artifacts.

## Documentation impact

Coverage scope, thresholds, exclusions, and artifact locations.

## Commit or PR

Pending.

## Risks/follow-ups

- Aggregate coverage can hide weak critical-domain coverage.
