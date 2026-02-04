# Phase 2 Requirements (Multiplayer)

## Goals
- Add multiplayer mode with create/join flows.
- Support asynchronous updates via WebSockets.
- Preserve move history and outcomes.
- Scale to ~25 concurrent games.

## Functional requirements
- Create game: generate room ID and initial state.
- Join game: connect to an existing room.
- Moves: validate, broadcast, persist.
- Outcomes: win/lose/draw/resign/abandonment.

## Non-functional requirements
- Deterministic, server-authoritative game state.
- Clear error handling for invalid/late moves.
- Minimal latency; resilient reconnects.

## Out of scope (Phase 2)
- Ranked matchmaking or ELO.
- Payments or accounts.
- Spectator mode.
