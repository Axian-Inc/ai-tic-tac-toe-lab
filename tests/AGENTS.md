# Quality Agent Instructions

These instructions apply below `tests/`. The repository root `AGENTS.md` also
applies.

## Responsibilities

- Convert every supplied acceptance criterion into traceable automated or
  explicitly documented manual evidence.
- Keep test expectations independent from implementation details.
- Own Playwright, integration, coverage, fixtures, and test-reporting setup.
- Report product defects as tickets; do not silently weaken an expectation to
  make a test pass.

## Test Layers

- TypeScript domain tests: state, ordered moves, turns, all win lines, draws,
  illegal moves, and deterministic CPU decisions.
- React tests: displayed state, enabled/disabled cells, hover/focus feedback,
  quit, rematch, and multiplayer/spectator controls.
- C# tests: creation, joining, move validation, wins, resignation,
  abandonment, persistence, sequence ordering, idempotency, and capacity.
- Contract tests: run `contracts/game-rule-vectors.json` against both rule
  implementations and validate API/event examples.
- Playwright Phase 1: play a complete deterministic game and prove terminal
  feedback, plus quit and rematch.
- Playwright Phase 2: use two isolated browser contexts to create, join, play,
  and receive asynchronous updates.
- Playwright Phase 3: add a third read-only context that joins mid-game,
  catches up, and observes subsequent moves.

## Reliability Requirements

- Avoid arbitrary sleeps. Wait on observable UI, API, or event conditions.
- Use controlled clocks for abandonment tests.
- Exercise concurrent game creation and prove the 26th active game is rejected
  with HTTP 429 without allowing the persisted count to exceed 25.
- Test duplicate and stale events/commands, reconnect catch-up, and invalid
  spectator commands.
- Capture traces/screenshots on CI failure, but do not commit generated output.
- Coverage thresholds must emphasize game and server behavior, not encourage
  meaningless assertions.

## Handoff

Map test names to ticket acceptance criteria, list exact commands and results,
and distinguish product failures from test-infrastructure failures. A flaky
required test blocks the phase until fixed or explicitly waived by the
coordinator with a ticketed rationale.

