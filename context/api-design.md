# API Design

This document captures the Phase 2 API and backend design baseline for multiplayer Tic Tac Toe.

## Goals

- Keep the backend in TypeScript/Node on AWS Lambda
- Use DynamoDB as the system of record for multiplayer games
- Support create, join, move, resign, spectate, replay, and abandonment flows
- Keep WebSockets focused on live event delivery
- Preserve enough state to reconstruct and replay games

## Domain Model

### Game status

- `waiting`: created, waiting for a second player
- `active`: two players joined, game in progress
- `over`: terminal state

### Terminal reason

- `win`: a player completed a normal winning line
- `draw`: board filled with no winner
- `resignation`: a player resigned
- `abandonment`: the non-idle player won after a successful abandonment check

### Player slot

- `X`
- `O`

### Suggested game record fields

- `gameId`
- `status`
- `createdAt`
- `updatedAt`
- `startedAt`
- `endedAt`
- `lastMoveAt`
- `createdByConnectionHint`
- `xPlayerId`
- `oPlayerId`
- `spectatorCount`
- `board`
- `nextMark`
- `winner`
- `terminalReason`
- `moveCount`
- `moves`

## Identity Model

There is no auth layer in Phase 2, but player actions still need stable per-game identities.

### Proposal

- The server generates opaque participant ids
- `POST /games` returns a creator `playerId`
- `POST /games/{id}/join` returns a joiner `playerId`
- `POST /games/{id}/spectate` returns a `spectatorId`
- These ids are not user accounts; they are game-scoped capability tokens
- Future mutating requests must include the relevant `playerId`

### Why this shape

- The server needs to know which player is moving, resigning, or probing abandonment
- Anonymous capability ids keep Phase 2 auth-free without making commands ambiguous
- Spectators can be tracked separately from players if needed

### Spectator token decision

- `spectatorId` is a lightweight game-scoped token
- It is not stored as a durable spectator record
- Live spectator presence is represented by WebSocket connection records instead

## DynamoDB Design

## Recommendation

Start with two tables, not one.

### 1. `games`

Stores the authoritative game snapshot and enough metadata for listing and concurrency checks.

#### Primary key

- Partition key: `gameId`

#### Attributes

- `gameId`
- `status`
- `createdAt`
- `updatedAt`
- `startedAt`
- `endedAt`
- `lastMoveAt`
- `xPlayerId`
- `oPlayerId`
- `board`
- `nextMark`
- `winner`
- `terminalReason`
- `moveCount`

#### Global secondary indexes

- `status-createdAt-index`
  - partition key: `status`
  - sort key: `createdAt`
  - used for `GET /games?status=...`

### 2. `game_events`

Stores ordered history for replay and catch-up.

#### Primary key

- Partition key: `gameId`
- Sort key: `sequenceNumber`

#### Attributes

- `gameId`
- `sequenceNumber`
- `eventType`
- `createdAt`
- `actorType`
- `actorId`
- `payload`

### Why two tables

- The `games` table supports fast current-state reads and status-based listing
- The `game_events` table supports replay and ordered history without rewriting large array attributes
- Event history grows naturally over time and should not bloat the hot game record

### Why not one table

- A single-item design with embedded move arrays becomes awkward as event history grows
- Appending moves inside one large record creates more write contention and more payload churn
- Listing and replay have different access patterns and are cleaner when separated

## Concurrency Limit Design

### Rule

The 25-game cap counts games where `status` is `waiting` or `active`.

### Proposed enforcement

- On `POST /games`, query counts for `waiting` and `active`
- If combined count is `>= 25`, return HTTP `429`
- Otherwise create the new waiting game

### Practical note

This is good enough for Phase 2 scale, but it is not perfectly race-proof under simultaneous create requests.

### If we need stronger enforcement later

- Add a dedicated capacity counter item with conditional writes
- Or introduce a reservation workflow

## HTTP API

## Common response shape

Suggested error body:

```json
{
  "error": {
    "code": "invalid_move",
    "message": "Square 4 is already occupied."
  }
}
```

## `POST /games`

Creates a new waiting multiplayer game.

### Request body

```json
{
  "gameName": "Otter Austin",
  "playerName": "Major Mischief"
}
```

### Response `201`

```json
{
  "game": {
    "gameId": "g_123",
    "gameName": "Otter Austin",
    "xPlayerName": "Major Mischief",
    "oPlayerName": null,
    "status": "waiting",
    "board": [null, null, null, null, null, null, null, null, null],
    "nextMark": "X",
    "moveCount": 0,
    "winner": null,
    "terminalReason": null,
    "createdAt": "2026-03-21T18:00:00Z",
    "updatedAt": "2026-03-21T18:00:00Z"
  },
  "participant": {
    "role": "player",
    "mark": "X",
    "playerId": "p_x_123"
  },
  "links": {
    "gameUrl": "https://app.example.com/games/g_123"
  }
}
```

### Errors

- `429` if 25 non-terminal games already exist

## `GET /games/{id}`

Returns the current snapshot and ordered event history.

### Response `200`

```json
{
  "game": {
    "gameId": "g_123",
    "gameName": "Otter Austin",
    "xPlayerName": "Major Mischief",
    "oPlayerName": "Captain Curious",
    "status": "active",
    "board": ["X", null, null, null, "O", null, null, null, null],
    "nextMark": "X",
    "moveCount": 2,
    "winner": null,
    "terminalReason": null,
    "createdAt": "2026-03-21T18:00:00Z",
    "updatedAt": "2026-03-21T18:01:10Z",
    "startedAt": "2026-03-21T18:00:20Z",
    "lastMoveAt": "2026-03-21T18:01:10Z"
  },
  "players": {
    "X": {
      "joined": true
    },
    "O": {
      "joined": true
    }
  },
  "events": [
    {
      "sequenceNumber": 1,
      "eventType": "game_created",
      "createdAt": "2026-03-21T18:00:00Z",
      "payload": {
        "gameId": "g_123",
        "gameName": "Otter Austin"
      }
    },
    {
      "sequenceNumber": 2,
      "eventType": "player_joined",
      "createdAt": "2026-03-21T18:00:20Z",
      "payload": {
        "mark": "O"
      }
    },
    {
      "sequenceNumber": 3,
      "eventType": "move_accepted",
      "createdAt": "2026-03-21T18:00:45Z",
      "payload": {
        "mark": "X",
        "square": 0
      }
    }
  ]
}
```

### Why include history here

- Supports replay
- Supports reconnect catch-up
- Keeps the socket protocol simpler

## `GET /games?status=waiting|active|over`

Returns lightweight game summaries.

### Response `200`

```json
{
  "games": [
    {
      "gameId": "g_123",
      "status": "waiting",
      "createdAt": "2026-03-21T18:00:00Z",
      "updatedAt": "2026-03-21T18:00:00Z",
      "moveCount": 0
    }
  ]
}
```

## `POST /games/{id}/join`

Joins a waiting game as the second player.

### Request body

```json
{
  "playerName": "Captain Curious"
}
```

### Response `200`

```json
{
  "game": {
    "gameId": "g_123",
    "gameName": "Otter Austin",
    "xPlayerName": "Major Mischief",
    "oPlayerName": "Captain Curious",
    "status": "active",
    "nextMark": "X"
  },
  "participant": {
    "role": "player",
    "mark": "O",
    "playerId": "p_o_123"
  },
  "links": {
    "gameUrl": "https://app.example.com/games/g_123"
  }
}
```

### Errors

- `404` if game does not exist
- `409` if game is not joinable

## `POST /games/{id}/moves`

Submits a move suggestion for server validation.

### Request body

```json
{
  "playerId": "p_x_123",
  "square": 0
}
```

### Response `200`

```json
{
  "game": {
    "gameId": "g_123",
    "status": "active",
    "board": ["X", null, null, null, null, null, null, null, null],
    "nextMark": "O",
    "moveCount": 1,
    "winner": null,
    "terminalReason": null,
    "lastMoveAt": "2026-03-21T18:01:10Z"
  },
  "event": {
    "sequenceNumber": 3,
    "eventType": "move_accepted"
  }
}
```

### Errors

- `400` invalid square
- `403` player is not allowed to act in this game
- `409` wrong turn, occupied square, or game not active

## `POST /games/{id}/resign`

Ends the game with the other player winning by resignation.

### Request body

```json
{
  "playerId": "p_x_123"
}
```

### Response `200`

```json
{
  "game": {
    "gameId": "g_123",
    "status": "over",
    "winner": "O",
    "terminalReason": "resignation"
  }
}
```

## `POST /games/{id}/spectate`

Registers a spectator intent and returns enough data to observe the game.

### Request body

```json
{}
```

### Response `200`

```json
{
  "spectator": {
    "spectatorId": "s_123"
  },
  "game": {
    "gameId": "g_123",
    "status": "active"
  },
  "websocket": {
    "gameId": "g_123"
  }
}
```

### Recommendation

Keep this endpoint simple for Phase 2. It should validate the game exists, issue a lightweight spectator token, and let the client call `GET /games/{id}` plus open the WebSocket normally.

## `POST /games/{id}/abandonment-check`

Compatibility endpoint for inactivity evaluation. Stale active games are now normally ended automatically during standard server interactions.

### Request body

```json
{
  "playerId": "p_x_123"
}
```

### Response `200`

```json
{
  "abandonmentChecked": true,
  "game": {
    "gameId": "g_123",
    "status": "over",
    "winner": "X",
    "terminalReason": "abandonment"
  }
}
```

### Alternative non-terminal response

```json
{
  "abandonmentChecked": true,
  "game": {
    "gameId": "g_123",
    "status": "active"
  },
  "result": "not_abandoned"
}
```

### Timestamp rule recommendation

Use `lastMoveAt` once a game is active. For a game that has not yet received a move after becoming active, use `startedAt`.

## WebSocket Design

## Connection model

- Client connects to `WS /ws?gameId=...`
- Connection is associated with one game
- Players and spectators can both subscribe
- The server stores connection metadata in a dedicated DynamoDB connections table

## Connections table recommendation

### Primary key

- Partition key: `gameId`
- Sort key: `connectionId`

### Attributes

- `gameId`
- `connectionId`
- `participantType`
- `participantId`
- `connectedAt`
- `ttl`

### Cleanup behavior

- Delete records on normal WebSocket disconnect
- Delete records when broadcast attempts fail because the connection is gone
- Use TTL as a passive cleanup backstop rather than the primary cleanup mechanism

## Event envelope

```json
{
  "type": "move_accepted",
  "gameId": "g_123",
  "sequenceNumber": 3,
  "createdAt": "2026-03-21T18:01:10Z",
  "data": {
    "mark": "X",
    "square": 0,
    "board": ["X", null, null, null, null, null, null, null, null],
    "nextMark": "O",
    "winner": null,
    "terminalReason": null,
    "status": "active"
  }
}
```

## Event types

- `game_created`
- `player_joined`
- `move_accepted`
- `game_resigned`
- `abandonment_checked`
- `game_over`

## Recommendation on event granularity

Emit both domain-specific events and a final `game_over` event when a terminal transition happens.

### Why

- Domain-specific events keep clients informative
- `game_over` gives a single terminal event clients can always rely on

## Sequence handling

- Every persisted game event gets a monotonic `sequenceNumber`
- Clients can use the sequence for ordering and missed-event detection
- If a client detects a gap, it should refetch `GET /games/{id}`

## Lambda Boundary Recommendation

Use multiple focused Lambda handlers, not one giant handler.

### Proposed handlers

- `games-create-handler`
- `games-read-handler`
- `games-list-handler`
- `games-join-handler`
- `games-move-handler`
- `games-resign-handler`
- `games-spectate-handler`
- `games-abandonment-check-handler`
- `ws-connect-handler`
- `ws-disconnect-handler`
- `ws-default-handler`
- `ws-broadcast-support` shared module or helper path used by mutating handlers

### Why split them

- Clearer ownership and smaller handler logic
- Easier tests per route
- Easier IAM scoping if needed later
- Lower risk of one transport concern turning into a monolith

### Why not split even further

- Too many tiny handlers can create deployment and wiring overhead
- Shared domain and repository modules should hold most of the real logic anyway

## Recommended internal package layout

```text
backend/
  src/
    domain/
    repositories/
    http/
    websocket/
    handlers/
    shared/
```

## Key Open Questions

- None in the current Phase 2 design baseline
