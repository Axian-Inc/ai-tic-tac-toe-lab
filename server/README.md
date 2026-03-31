# Server Plan

This directory is reserved for the Phase 2 multiplayer backend.

Story `2.1` defines the intended server shape but does not implement handlers yet. The planned responsibilities are:

- HTTP routes for multiplayer game lifecycle actions
- WebSocket fan-out for live game updates
- authoritative move validation and state transitions
- replayable in-memory or persisted game history
- abandonment and resign decision handling

The shared DTO and event contracts for that server live in `shared/contracts/multiplayer.ts`.
