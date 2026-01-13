# Story 001 (Deprecated)

## Title
- Define shared game state schema and validation (deprecated)

## Context
- The API, web UI, and CLI must share a single source of truth for request/response shapes and game state.

## Problem Statement
- Without shared schemas, validation and type drift will cause inconsistent behavior across clients and backend.

## Inputs
- Game state, move requests, move responses, and error responses exchanged between API, web UI, and CLI.

## Outputs
- Zod schemas and derived TypeScript types exported from `src/shared`.

## Acceptance Criteria
- [ ] `src/shared` exports zod schemas named `GameState`, `MoveRequest`, `MoveResponse`, and `ErrorResponse`.
- [ ] `GameState` fields are explicit: `board` (length 9 array of `X|O|null`), `nextPlayer` (`X|O`), `gameStatus` (`in_progress|win|draw`), `winner` (`X|O|null`), `opponentId` (string), `sessionId` (string), and optional `moveHistory` (array of `{player, index}`).
- [ ] `MoveRequest` includes `{state: GameState, playerMoveIndex: number}`; `MoveResponse` includes `{state: GameState, aiRationale?: string}`.
- [ ] `ErrorResponse` includes `{errorCode: string, message: string, details?: unknown}`.
- [ ] Types are derived from schemas and imported by backend, web, and CLI.

## Definition of Done
- [ ] Schemas compile with TypeScript and are imported by at least one layer per consumer (backend, web, CLI).
- [ ] Unit tests validate at least 3 valid payloads and 3 invalid payloads (e.g., board length != 9, invalid symbol, winner set with `gameStatus != win`).

## Dependencies
- None.

## Status
- Completed (deprecated in favor of Story 009-012).

## Notes
- This story is split into Story 009-012 with a test-first approach; implement those instead.
- Keep schema minimal but extensible for POC needs.
