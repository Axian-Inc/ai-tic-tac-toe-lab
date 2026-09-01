# ADR-003: Preserve ordered game events

- Status: accepted
- Date: 2026-08-26
- Owners: coordinator and application
- Related tickets: PH2-001, PH2-002, PH3-001

## Context

Players and spectators must obtain current state, receive asynchronous updates,
and replay older games. WebSocket delivery may be repeated, delayed, or missed
during reconnects.

## Decision

Persist exactly one durable event for every accepted command with a
monotonically increasing per-game sequence starting at 1. Persist aggregate
state, event, accepted-command receipt, and any capacity change atomically
before attempting publication. Each command carries a UUID `commandId` and,
except for create, an `expectedSequence`. An identical retry returns the exact
accepted response without another event; reuse with different canonical input
is a conflict.

WebSocket delivery is at least once. A subscription registers before reading
an authoritative snapshot and reports a `throughSequence` boundary. Clients
deduplicate, buffer out-of-order messages, and close gaps through the ordered
HTTP replay endpoint. The accepted envelope and event names are frozen in
`contracts/websocket-events.md` and `contracts/multiplayer-domain.md`.

## Alternatives considered

- Store only the latest board: simple but cannot meet replay requirements.
- Trust client history: violates server authority and complicates recovery.

## Consequences

- Replay, audit, and spectator catch-up become possible.
- Transaction and ordering rules need concurrency tests.
- Retention and item-size behavior must be documented before Phase 2 closes.
