# Story 010

## Title
- Define move and error schemas with test-first validation

## Context
- Request/response contracts for moves and errors must be shared across API, web UI, and CLI.

## Problem Statement
- Without a shared contract for moves and errors, input validation and error handling diverge across clients.

## Inputs
- Move requests and responses, error responses.

## Outputs
- Zod schemas `MoveRequest`, `MoveResponse`, and `ErrorResponse` with derived types exported from `src/shared`.

## Acceptance Criteria
- [ ] Tests are written first for `MoveRequest`, `MoveResponse`, and `ErrorResponse` valid and invalid payloads, then implementation is added to pass them.
- [ ] `MoveRequest` includes `{state: GameState, playerMoveIndex: number}`.
- [ ] `MoveResponse` includes `{state: GameState, aiRationale?: string}`.
- [ ] `ErrorResponse` includes `{errorCode: string, message: string, details?: unknown}`.
- [ ] At least 3 valid and 3 invalid payloads are covered across these schemas (e.g., missing `state`, non-numeric `playerMoveIndex`, missing `errorCode`).

## Definition of Done
- [ ] Schemas compile with TypeScript and are exported from `src/shared`.
- [ ] Tests pass locally without requiring API or UI code.

## Dependencies
- Story 009 (GameState schema).

## Notes
- Keep error payloads flexible enough for backend diagnostics.
