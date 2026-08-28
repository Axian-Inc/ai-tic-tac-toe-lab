# PH1-001: Build deterministic single-player game

- Status: done
- Owner: application
- Branch: `application/phase-1-single-player`
- Dependencies: FND-001, FND-003
- Requirement source: `docs/requirements/phase-1.md`

## Acceptance criteria

- [x] Game core tracks ordered moves, turn, wins, draw, and terminal state.
- [x] Deterministic, beatable CPU returns the same move for the same board.
- [x] Landing/game views support legal feedback, quit, rematch, confetti, and distinct sounds.
- [x] Domain and UI reject illegal moves.

## Implementation notes

Prefer code-generated or clearly licensed sound assets; record the CPU policy
in an ADR.

## Automated/manual evidence

- Twenty-five game-core tests and seven React component tests pass in CI.
- Three browser acceptance scenarios cover win/rematch, loss/retry, illegal
  placement, and quit. Written feedback remains observable when audio or
  animation is unavailable.

## Documentation impact

Gameplay, CPU policy, sound behavior, accessibility, and troubleshooting.

## Commit or PR

PR #24, merged into `zebanaya-kepler`.

## Risks/follow-ups

- Manual speaker output and broad assistive-technology/browser coverage are not
  asserted by automation; audio remains supplementary to written state.
