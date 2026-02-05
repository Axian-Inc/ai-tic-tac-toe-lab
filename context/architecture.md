# Architecture (Draft)
Date: 2026-02-05

## High-Level Design
- Client-only React + TypeScript app.
- Game logic isolated in a Game module.
- Single-page UI with inline status indicators.
- UI layer renders game state and enforces UI-level constraints (no illegal moves).
- Deterministic CPU strategy invoked from game flow.

## Components (Proposed)
- `Game` module: state, move history, turn calculation, win/draw detection, CPU move selection.
- `GameBoard` UI: grid rendering, hover feedback, click handling.
- `GameStatus` UI: current turn, winner, draw, messages.
- `Landing` UI: entry CTA (Play vs CPU).
- `Audio` utility: handles playback for win/lose/move.
- `Effects` utility: confetti trigger.

## Data Flow (Proposed)
- Landing -> initialize game state -> Game screen.
- Player move -> Game module validates -> update state -> UI render -> CPU move -> update state.
- Game end -> show outcome, play sound, confetti if win.

## Open Questions
- State management approach (local state, reducer, context)?
- Any routing framework requirement?
 
## Decisions
- CPU algorithm: deterministic, smart-but-beatable strategy (not optimal minimax).
