# FND-004: Establish independent quality harness

- Status: done
- Owner: quality
- Branch: `quality/acceptance`
- Dependencies: FND-001, FND-003
- Requirement source: Phase 1 acceptance criteria

## Acceptance criteria

- [x] Establish unit, component, server, integration, and Playwright conventions.
- [x] Keep deterministic fixtures independent of application internals.
- [x] Make diagnostics and coverage paths compatible with CI artifact upload.

## Implementation notes

Quality may commit a failing acceptance test when its blocked ticket and
expected behavior are explicit.

## Automated/manual evidence

- The integrated workflow passed 36 unit/component/contract tests, three
  Playwright scenarios, .NET tests/build, and coverage artifact upload.

## Documentation impact

Document suite purposes and local debugging.

## Commit or PR

PR #19 established the harness; PR #25 supplied Phase 1 acceptance coverage.
Both are merged into `zebanaya-kepler`.

## Risks/follow-ups

- New suites must coordinate workspace and lockfile changes through the current
  integration branch.
