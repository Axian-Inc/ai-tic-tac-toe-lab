# Story 009

## Title
- Define GameState schema with test-first validation

## Context
- Shared game state needs a concrete schema before rules or API can rely on it.

## Problem Statement
- Without a validated GameState shape, downstream rules and API contracts drift and tests are brittle.

## Inputs
- Game state fields shared across API, web UI, and CLI.

## Outputs
- Zod schema `GameState` and derived TypeScript type exported from `src/shared`.

## Acceptance Criteria
- [ ] Tests are written first for `GameState` valid and invalid payloads, then implementation is added to pass them.
- [ ] `GameState` schema includes: `board` (length 9 array of `X|O|null`), `nextPlayer` (`X|O`), `gameStatus` (`in_progress|win|draw`), `winner` (`X|O|null`), `opponentId` (string), `sessionId` (string), and optional `moveHistory` (array of `{player, index}`).
- [ ] At least 3 valid and 3 invalid `GameState` payloads are covered in tests (e.g., board length != 9, invalid symbol, missing `nextPlayer`).
- [ ] Types are derived from the schema and exported from `src/shared`.

## Assumptions/Questions
- None.

## Plan
- [x] Write failing `GameState` schema tests for valid and invalid payloads.
- [x] Implement `GameState` schema and exports in `src/shared`.
- [x] Run tests to verify schema validation behavior.

## Definition of Done
- [x] `GameState` schema compiles with TypeScript.
- [x] Tests pass locally without requiring API or UI code.

## Dependencies
- None.

## Notes
- Keep the schema minimal but extensible for POC needs.
- Tests run: `npm test`.

## Done
- Verified `GameState` schema and tests.
