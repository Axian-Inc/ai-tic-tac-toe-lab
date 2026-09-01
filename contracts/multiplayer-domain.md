# Multiplayer Domain Contract

Status: accepted for Phase 2

This contract freezes the server-authoritative vocabulary and behavior shared
by the .NET 10 service, React client, persistence adapter, WebSocket adapter,
infrastructure, documentation, and acceptance suites.

## Identity boundary and seats

Phase 2 has no user accounts, login, or durable user identity. A game has two
seats:

- the creator receives `X`;
- the joining player receives `O`;
- `X` moves first.

Create and join responses return a random, opaque seat capability. Player-only
commands send it as `Authorization: Bearer <seatToken>`. The capability is
scoped to one seat in one game and must never appear in public snapshots,
events, logs, list results, or WebSocket subscription messages. This is a
game-scoped command capability, not a user authentication system. Game records
store only a token hash; an idempotency receipt may retain the encrypted exact
response needed to replay a create/join request.

Spectating, snapshots, event replay, and game lists are public in Phase 2.

## Lifecycle and result

Multiplayer lifecycle values are separate from Phase 1 local-game statuses:

- `waiting`: the creator holds `X` and the `O` seat is open;
- `active`: both seats are filled and moves may be accepted;
- `over`: no further game command may change state.

An over game has `endReason` equal to `line`, `draw`, `resignation`,
`abandonment`, or `cancelled`. `winner` is `X` or `O` for a line win,
resignation, or abandonment, and is `null` for a draw or waiting-game
cancellation.

The authoritative snapshot contains the board, ordered move history,
`currentTurn`, `winner`, `endReason`, current `sequence`, and server timestamps.
Seat capabilities are never part of the snapshot.

## HTTP surface

The accepted HTTP prefix is `/api/v1`:

- `POST /games`: create a waiting game and the `X` seat;
- `GET /games?status=waiting|active|over&cursor=&limit=`: list games;
- `GET /games/{gameId}`: get an authoritative snapshot;
- `GET /games/{gameId}/events?afterSequence=&cursor=&limit=`: replay events;
- `POST /games/{gameId}/join`: claim `O` and activate the game;
- `POST /games/{gameId}/moves`: suggest a move;
- `POST /games/{gameId}/resign`: resign an active game or cancel a waiting
  game as its creator;
- `POST /games/{gameId}/abandonment-check`: request a server-time decision.

The OpenAPI document is the source of truth for bodies, responses, and stable
error codes. Authoritative snapshot and replay reads are strongly consistent.
Status lists may be eventually consistent and must be labelled as such.

## Commands and optimistic concurrency

Every POST body includes a globally unique UUID `commandId`. Game mutations
other than create also include `expectedSequence`. A move additionally carries
the zero-based `cell` from `0` through `8`.

For an accepted command, the server stores the canonical request hash and exact
response as an idempotency receipt. Retrying the same `commandId` and canonical
request returns the original status/body and emits no new event. Reusing the ID
with different method, path, caller, or body returns HTTP 409 with
`idempotency_conflict`. Receipt lookup happens before sequence validation.

State-changing transactions condition on the current sequence. A losing race
returns HTTP 409 `stale_sequence` with `currentSequence`; a terminal aggregate
returns `game_over` where applicable. Simultaneous join, move, resign, and
abandonment operations have exactly one winning transaction.

## Ordered history and publication

Sequence is per game, starts at `1`, and never repeats. Creating a game stores
`game.created` at sequence 1. Each later accepted command persists exactly one
event:

- `player.joined`;
- `move.accepted`;
- `game.resigned`;
- `game.abandoned`;
- `game.cancelled`.

A winning or drawing move remains one `move.accepted` event whose embedded
state is terminal. State, event, capacity change, and accepted-command receipt
are persisted atomically before publication. Broadcast failure does not roll
back an accepted command; clients recover through replay.

Events are retained for the complete Phase 2 game lifetime and returned in
ascending sequence. `afterSequence` is exclusive. Phase 2 does not prune game
events. The state must be rebuildable from sequence 1 through the current
sequence.

## Abandonment

Only an active game can be abandoned. The server uses injected server UTC,
never client time. `turnStartedAt` is set when `O` joins and after each accepted
move. Connection, subscription, list, snapshot, replay, rejected commands, and
abandonment probes do not reset it.

A seat may claim abandonment only while it is the opponent's turn and server
time is greater than or equal to `turnStartedAt + 180 seconds`. The requester
wins. The terminal transaction rechecks status, sequence, claimant, and
deadline and releases capacity atomically. A probe before the deadline returns
HTTP 409 `abandonment_not_due` with `eligibleAt`.

## Capacity

Waiting and active games both consume one of 25 capacity slots. Create acquires
a slot with a conditional counter update in the same DynamoDB transaction that
stores the game, sequence-1 event, and receipt. Count-then-create is forbidden.

The 26th create returns HTTP 429 `capacity_exhausted` and `Retry-After: 5`.
That failed attempt stores no receipt, so the same command can succeed later.
Every transition to `over` conditionally flips `capacityHeld` and decrements
the counter in the same transaction, making release idempotent.

A waiting creator may call resign to produce `game.cancelled`, with no winner,
and release the slot. Phase 2 adds no automatic waiting-game expiry. Operations
must document capacity reconciliation for abandoned waiting games or a leaked
counter; automatic expiry is a future policy decision.

## Error and time conventions

Errors use RFC 9457 problem details plus a stable `code`, `traceId`, and, when
relevant, `currentSequence` or `eligibleAt`. Expected status classes are:

- 400 for malformed or invalid input;
- 401 for a missing or invalid seat capability on a player command;
- 404 for an unknown game;
- 409 for lifecycle, rule, idempotency, or optimistic-concurrency conflicts;
- 429 for exhausted game capacity.

Stable Phase 2 codes are `invalid_request`, `invalid_capability`,
`game_not_found`, `game_not_waiting`, `game_not_active`, `game_over`,
`wrong_turn`, `occupied`, `idempotency_conflict`, `stale_sequence`,
`abandonment_not_due`, `not_opponent_turn`, `invalid_cursor`, and
`capacity_exhausted`.

All timestamps are RFC 3339 UTC with millisecond precision. Server decisions
use .NET `TimeProvider` so boundary behavior can be tested without sleeping.

## Client reconciliation

The client suggests commands but never declares authoritative multiplayer
state. It applies only contiguous server sequences, deduplicates repeats,
buffers out-of-order events, and fetches replay on a gap or reconnect. Phase 1
local-game behavior remains independent and must continue to pass unchanged.
