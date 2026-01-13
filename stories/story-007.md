# Story 007

## Title
- Add game logic and AI validation tests

## Context
- Deterministic tests protect core rules and AI parsing from regressions.

## Problem Statement
- Without tests, regressions in move validation or AI parsing are likely.

## Inputs
- Test fixtures for board state, next player, and expected outcome.
- Mocked AI responses for parsing and validation.

## Outputs
- Deterministic test assertions for game rules and AI parsing behavior.

## Acceptance Criteria
- [ ] Game rules tests cover at least 4 cases: win, draw, invalid move, and turn order.
- [ ] AI parsing tests validate schema acceptance and illegal move rejection (at least 3 cases).
- [ ] Per opponent profile, at least 3 deterministic must-do scenarios pass with explicit fixture inputs and expected moves.

## Definition of Done
- [ ] Tests run via `pnpm test` in the workspace.
- [ ] Tests are isolated and do not require Bedrock network calls.

## Dependencies
- Story 011 (schemas), Story 002 (rules), Story 004 (AI integration).

## Notes
- Use fixtures for deterministic scenarios.
