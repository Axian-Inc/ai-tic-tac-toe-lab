# PH1-002: Prove Phase 1 behavior

- Status: planned
- Owner: quality
- Branch: `quality/phase-1-acceptance`
- Dependencies: FND-004, PH1-001
- Requirement source: `docs/requirements/phase-1.md`

## Acceptance criteria

- [ ] Cover game-core state transitions and illegal moves.
- [ ] Cover relevant UI feedback and controls.
- [ ] Play a complete deterministic winning game in Playwright.
- [ ] Run all tests from stable root commands.

## Implementation notes

The end-to-end test must not depend on timing races or random CPU decisions.

## Automated/manual evidence

- Pending: `npm run test:unit` and `npm run test:e2e`.

## Documentation impact

Testing guide and failure-diagnostic locations.

## Commit or PR

Pending.

## Risks/follow-ups

- Browser audio autoplay restrictions may require observable non-audio state.
