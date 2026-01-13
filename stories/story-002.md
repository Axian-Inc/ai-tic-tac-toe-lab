# Story 002

## Title
- Implement game rules and move validation

## Context
- Core rules must be deterministic and reusable across API and tests.

## Problem Statement
- Without a single game engine, move legality, win/draw logic, and turn order will be inconsistent.

## Inputs
- `GameState` and a move index for the current player.

## Outputs
- Updated `GameState` or a structured error with `errorCode`.

## Acceptance Criteria
- [ ] Pure functions exist with explicit signatures: `validateMove(state, index) -> {ok: true} | {ok: false, errorCode, message}` and `applyMove(state, index) -> {state} | {errorCode, message}`.
- [ ] `computeStatus(state) -> {gameStatus, winner}` is deterministic for a given board.
- [ ] Rules enforce classic 3x3 Tic-Tac-Toe, X goes first, and alternating turns based on `nextPlayer`.
- [ ] Invalid moves (occupied cell, out of range, wrong player, terminal state) return `ErrorResponse` without mutating state.

## Definition of Done
- [ ] Unit tests cover win, draw, illegal move, out-of-turn, and terminal-state move cases with explicit input boards and expected outputs.
- [ ] Logic is independent of transport (no Fastify or UI imports).

## Dependencies
- Story 001 (shared schema/types).

## Notes
- Prefer immutable state updates for easy testing.
