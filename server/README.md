# Server Overview

This directory contains the implemented multiplayer backend for the Tic Tac Toe lab.

Current responsibilities:

- HTTP routes for multiplayer game lifecycle actions and spectator reads
- WebSocket fan-out for live game updates and spectator synchronization
- authoritative move validation and state transitions
- replayable in-memory game history
- abandonment and resign decision handling

The shared DTO and event contracts for the server live in `shared/contracts/multiplayer.ts`.
