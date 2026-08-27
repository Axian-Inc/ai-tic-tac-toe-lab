# PH1-001: Build deterministic single-player game

- Status: planned
- Owner: application
- Branch: `application/phase-1-single-player`
- Dependencies: FND-001, FND-003
- Requirement source: `docs/requirements/phase-1.md`

## Acceptance criteria

- [ ] Game core tracks ordered moves, turn, wins, draw, and terminal state.
- [ ] Deterministic, beatable CPU returns the same move for the same board.
- [ ] Landing/game views support legal feedback, quit, rematch, confetti, and distinct sounds.
- [ ] Domain and UI reject illegal moves.

## Implementation notes

Prefer code-generated or clearly licensed sound assets; record the CPU policy
in an ADR.

## Automated/manual evidence

- Pending: unit/component tests and manual accessibility review.

## Documentation impact

Gameplay, CPU policy, sound behavior, accessibility, and troubleshooting.

## Commit or PR

Pending.

## Risks/follow-ups

- An unbeatable CPU conflicts with the required player-win Playwright path.
