# Multiplayer Architecture Baseline

This document captures the Phase 2 Story `2.1` contract and structure decisions. It defines how the client and server are expected to communicate before route handlers and WebSocket plumbing are implemented.

## Scope of This Story

Story `2.1` is design and contract work only:

- choose the backend shape
- define the shared HTTP and WebSocket contracts
- define the server-side game identifier and state model
- document the expected project structure for later multiplayer stories

It does not implement the server yet.

## Chosen Backend Shape

The multiplayer backend will be a dedicated server under `server/` with two transport surfaces:

- HTTP for commands and list/read operations
- WebSocket for async game updates and catch-up snapshots

The server is authoritative for:

- game creation and join eligibility
- move validation
- resign and abandonment decisions
- game-over transitions
- replay history ordering
- concurrent game limits

## Shared Contract Location

Shared multiplayer contracts live in `shared/contracts/multiplayer.ts`.

That file is intended to be imported by both the browser client and the future server so route payloads, event payloads, and state snapshots stay aligned.

## Identifier and Role Decisions

- `gameId`: server-generated opaque string
- `sessionId`: server-generated opaque string with no auth meaning beyond identifying a participant seat in a game
- roles:
  - `host`
  - `guest`
  - `spectator`
- player marks:
  - `host = X`
  - `guest = O`

This keeps the first player deterministic and removes any need for user identity in Phase 2.

## Server State Model

The contract defines a `MultiplayerGameState` snapshot with:

- game identity and lifecycle status
- board state
- current player
- winner and winning line
- end reason
- timestamps for create/start/update/end activity
- abandonment deadline
- replay cursor
- player seat metadata
- ordered move history

The server should treat this snapshot as the canonical shape returned by mutation endpoints and pushed over WebSocket updates.

## HTTP Contract

Chosen endpoint set:

- `POST /games`
- `GET /games?status=waiting|active|over`
- `POST /games/{id}/join`
- `POST /games/{id}/moves`
- `POST /games/{id}/resign`
- `POST /games/{id}/abandonment-check`

The shared contract intentionally keeps mutation responses uniform:

- every successful mutation returns the full `game` snapshot
- every successful mutation that changes state also returns the emitted `event`
- player-authenticated mutation requests carry the server-issued `sessionId` because Phase 2 has no user auth layer

This reduces client-side branching and makes replay/catch-up logic easier to reason about.

## WebSocket Contract

Chosen WebSocket shape:

- connection path: `WS /ws?gameId=...`
- server sends discriminated event payloads
- every event includes:
  - `eventId`
  - `gameId`
  - `sequence`
  - `occurredAt`
  - `game`

Chosen event types:

- `game.snapshot`
- `game.player.joined`
- `game.move.accepted`
- `game.resigned`
- `game.abandoned`
- `game.ended`

Including a full game snapshot on every event is slightly heavier, but it keeps client recovery and spectator catch-up simpler and is acceptable for the low-scale Phase 2 target.

## Capacity and Timing Rules

The shared contract locks in two key Phase 2 rules:

- max concurrent multiplayer games: `25`
- abandonment timeout: `3 minutes`

These are exposed as constants so future server and test code can share the same values.

## Project Structure Decision

The intended repo shape for upcoming multiplayer stories is:

- `server/` for HTTP and WebSocket server code
- `shared/contracts/` for client/server DTO and event types
- `src/` for browser UI and client orchestration
- `tests/` for unit, integration, and browser tests

This keeps the domain shared where useful while separating browser rendering from server authority.
