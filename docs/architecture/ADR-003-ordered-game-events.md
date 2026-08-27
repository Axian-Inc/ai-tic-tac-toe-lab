# ADR-003: Preserve ordered game events

- Status: proposed
- Date: 2026-08-26
- Owners: coordinator and application
- Related tickets: PH2-001, PH2-002, PH3-001

## Context

Players and spectators must obtain current state, receive asynchronous updates,
and replay older games. WebSocket delivery may be repeated, delayed, or missed
during reconnects.

## Proposed decision

Persist an ordered event history with a monotonically increasing per-game
sequence and derive game state from authoritative server decisions. Commands
should carry an idempotency mechanism. Reconnecting clients first catch up
from server state/history, then consume live events. Storage shape, event
names, and envelopes are pending coordinator approval.

## Alternatives considered

- Store only the latest board: simple but cannot meet replay requirements.
- Trust client history: violates server authority and complicates recovery.

## Consequences

- Replay, audit, and spectator catch-up become possible.
- Transaction and ordering rules need concurrency tests.
- Retention and item-size behavior must be documented before Phase 2 closes.
