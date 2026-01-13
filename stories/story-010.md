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
- [x] Tests are written first for `MoveRequest`, `MoveResponse`, and `ErrorResponse` valid and invalid payloads, then implementation is added to pass them.
- [x] `MoveRequest` includes `{state: GameState, playerMoveIndex: number}`.
- [x] `MoveResponse` includes `{state: GameState, aiRationale?: string}`.
- [x] `ErrorResponse` includes `{errorCode: string, message: string, details?: unknown}`.
- [x] At least 3 valid and 3 invalid payloads are covered across these schemas (e.g., missing `state`, non-numeric `playerMoveIndex`, missing `errorCode`).

## Plan
- [x] Add failing tests for `MoveRequest`, `MoveResponse`, and `ErrorResponse` schemas.
- [x] Implement schemas and exports in `src/shared`.
- [x] Run shared tests or targeted suite to confirm validation behavior.

## Definition of Done
- [x] Schemas compile with TypeScript and are exported from `src/shared`.
- [x] Tests pass locally without requiring API or UI code.

## Dependencies
- Story 009 (GameState schema).

## Notes
- Keep error payloads flexible enough for backend diagnostics.
- Tests run: `npm test`.
- Lint run: `npm run lint` (React version warning only).
- Format check: `npm run format:check`.

## Done
- Shared move and error schemas delivered with tests and verification.
