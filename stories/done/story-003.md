# Story 003

## Title
- Build stateless API endpoints for new game and moves

## Context
- The frontend and CLI rely on a stateless backend API with a consistent error contract.

## Problem Statement
- Without API endpoints, clients cannot coordinate game state or invoke the AI.

## Inputs
- `POST /v1/new-game` body: `{startingPlayer: "X"|"O", opponentId: string}`.
- `POST /v1/move` body: `{state: GameState, playerMoveIndex: number}`.

## Outputs
- Success: `MoveResponse` with updated `GameState` and optional `aiRationale`.
- Error: `ErrorResponse` with consistent error codes.

## Acceptance Criteria
- [x] `POST /v1/new-game` returns HTTP 200 with `GameState` initialized for the given `startingPlayer` and `opponentId`.
- [x] `POST /v1/move` returns HTTP 200 with updated `GameState` after applying player move and AI move.
- [x] Invalid input returns HTTP 400 with `ErrorResponse` (`errorCode`, `message`, `details?`).
- [x] Terminal state move attempts return HTTP 409 with `ErrorResponse`.

## Definition of Done
- [x] Requests/responses validated with shared zod schemas.
- [x] Request logging includes requestId/sessionId.
- [x] Unit tests cover new-game success, move success, invalid move, missing fields, and terminal-state move cases.

## Assumptions/Questions
- [x] Until Story 004, AI moves use a deterministic local stub to keep `/v1/move` behavior testable.

## Dependencies
- Story 011 (schemas), Story 002 (game rules).

## Plan
- [x] Add failing API tests for new-game success, move success, invalid move, missing fields, and terminal-state move cases.
- [x] Implement backend app/routes and service logic for `/v1/new-game` and `/v1/move`.
- [x] Validate requests/responses with shared zod schemas and standard error handling/logging.
- [x] Verify tests and update story checklist with results.

## Notes
- Keep routes thin; business logic lives in services.
- Tests run: `npm test`.
