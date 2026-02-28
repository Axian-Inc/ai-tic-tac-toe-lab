# Architecture

Last updated: 2026-02-28

## Game State Module
- Added `src/game/Game.ts` as the centralized state container for core Tic-Tac-Toe data.
- `Game` module exports shared domain types: `Player`, `Board`, `Move`, `GameStatus`, and `GameState`.
- `Game` class owns in-memory game state and exposes read APIs: `getState()`, `getBoard()`, `getMoves()`, `getCurrentPlayer()`, and `getStatus()`.
- Read methods return copies to keep internal state predictable and prevent external mutation.
- Added move APIs for gameplay progression:
  - `canPlaceMove(position)` validates board index, game-over state, and empty-cell requirement.
  - `placeMove(position)` safely rejects invalid placements and, on valid moves, records ordered move history and alternates current player.
- Added game resolution logic in `Game`:
  - Evaluates all 8 Tic-Tac-Toe winning lines after each valid move.
  - Sets `status.winner` and `status.isOver` immediately when a winning line is formed.
  - Sets draw status when the board is full with no winner.
  - Prevents additional moves after game over through `canPlaceMove(position)`.
