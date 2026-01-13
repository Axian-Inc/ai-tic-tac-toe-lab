# Story 011

## Title
- Add cross-field schema invariants with test-first coverage

## Context
- Basic shapes are not enough to prevent invalid game states from passing validation.

## Problem Statement
- Without cross-field validation, clients can send logically inconsistent states (e.g., winner set but status not win).

## Inputs
- Existing `GameState`, `MoveRequest`, and `MoveResponse` schemas.

## Outputs
- Additional refinements on shared schemas to enforce logical consistency.

## Acceptance Criteria
- [ ] Tests are written first for cross-field constraints, then refinements are added to pass them.
- [ ] `GameState.winner` is only allowed when `gameStatus` is `win`; otherwise it must be `null`.
- [ ] `gameStatus` of `draw` requires `winner` to be `null`.
- [ ] `moveHistory` indices (when present) are within `[0..8]` and use valid `player` symbols.
- [ ] At least 3 invalid cross-field payloads are covered in tests.

## Definition of Done
- [ ] Refinements do not break existing valid fixtures.
- [ ] Tests pass locally without requiring API or UI code.

## Dependencies
- Story 009 (GameState schema).
- Story 010 (move and error schemas).

## Notes
- Keep refinements simple; avoid embedding full game rules here.
