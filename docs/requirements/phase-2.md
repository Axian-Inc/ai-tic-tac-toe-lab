# Phase 2 Requirements

Status: source requirement
Versioned: 2026-08-26

## Server behavior

- Add an HTTP API that brokers multiplayer games.
- Accept and validate commands, update authoritative state, and broadcast
  events over WebSockets.
- Allow players and multiple third parties to spectate games.
- Support create, waiting/active/over listing, join, move, resign, spectate,
  abandonment-check, and game-scoped WebSocket use. Exact routes and schemas
  remain pending coordinator approval.
- End a game after three minutes without an opponent move when either client
  requests an abandonment decision; broadcast the winner.
- Validate suggested client moves before broadcasting them.
- Limit the system to 25 concurrent multiplayer games and return HTTP 429 when
  capacity is exhausted.
- Persist enough ordered data to replay and catch up to a live game.
- Test creation capacity, abandonment, and other key server behavior.
- End a resigned game with the other player as winner.
- Do not add user authentication or identity.

## Client and infrastructure behavior

- Keep Phase 1 single-player behavior working.
- Create and join waiting multiplayer games; joining starts the game and
  prevents additional player joins.
- Receive multiplayer updates asynchronously over WebSockets.
- Update IaC for a low-cost AWS footprint.

## Acceptance criteria

- Single-player and multiplayer features coexist.
- The Phase 1 Playwright journey still passes.
- Clients create/join games, preserve state and move order, receive live
  updates, and can win or lose against one another.
- Up to 25 concurrent games work, with multiplayer create/move coverage.
- Updated IaC represents the backend footprint.
