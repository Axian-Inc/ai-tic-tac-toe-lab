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
- [ ] `POST /v1/new-game` returns HTTP 200 with `GameState` initialized for the given `startingPlayer` and `opponentId`.
- [ ] `POST /v1/move` returns HTTP 200 with updated `GameState` after applying player move and AI move.
- [ ] Invalid input returns HTTP 400 with `ErrorResponse` (`errorCode`, `message`, `details?`).
- [ ] Terminal state move attempts return HTTP 409 with `ErrorResponse`.

## Definition of Done
- [ ] Requests/responses validated with shared zod schemas.
- [ ] Request logging includes requestId/sessionId.
- [ ] Unit tests cover new-game success, move success, invalid move, missing fields, and terminal-state move cases.

## Dependencies
- Story 001 (schemas), Story 002 (game rules).

## Notes
- Keep routes thin; business logic lives in services.
