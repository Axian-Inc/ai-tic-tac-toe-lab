# API Implementation

This document describes the current shipped multiplayer backend behavior in this repository. Unlike [api-design.md](api-design.md), this file is intended to reflect the implementation as it exists now.

## Scope

- HTTP API for multiplayer create, read, list, join, move, resign, spectate, and abandonment checks
- WebSocket connection handling and event broadcast shape
- Current persistence model and environment dependencies

## Runtime Shape

- Runtime: AWS Lambda on Node.js 22.x
- HTTP transport: API Gateway HTTP API
- Live updates: API Gateway WebSocket API
- Persistence:
  - `games` table for the latest game snapshot
  - `game_events` table for ordered event history
  - `connections` table for active WebSocket subscribers

## Environment

The backend expects these environment variables:

- `GAMES_TABLE_NAME`
- `GAME_EVENTS_TABLE_NAME`
- `CONNECTIONS_TABLE_NAME`
- `FRONTEND_BASE_URL`
- `WEBSOCKET_MANAGEMENT_ENDPOINT`

`FRONTEND_BASE_URL` is optional in practice. When it is unset, `links.gameUrl` is returned as `null`.

## Domain Model

### Game status

- `waiting`
- `active`
- `over`

### Terminal reason

- `win`
- `draw`
- `resignation`
- `abandonment`
- `null`

### Event types

- `game_created`
- `player_joined`
- `move_accepted`
- `game_resigned`
- `abandonment_checked`
- `game_over`

## HTTP Conventions

### Error shape

All handled errors return JSON in this shape:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "Field 'playerName' must be a non-empty string."
  }
}
```

### Common status codes

- `200` for successful reads and non-create mutations
- `201` for game creation
- `400` for malformed JSON, missing path params, invalid request fields, and invalid status filters
- `403` for player identity violations
- `404` for unknown games
- `409` for game-state conflicts such as non-joinable, not active, not your turn, or already over
- `429` when the non-terminal game limit is reached
- `500` for unexpected backend failures

### Automatic abandonment checks

These handlers automatically resolve stale active games before continuing:

- `GET /games/{id}`
- `GET /games?status=...`
- `POST /games/{id}/moves`
- `POST /games/{id}/resign`
- `POST /games/{id}/spectate`
- `POST /games/{id}/abandonment-check`

If an active game is stale, the backend persists the abandonment result and broadcasts the resulting events before returning.

## HTTP Routes

### `POST /games`

Creates a new waiting game and assigns the caller as player `X`.

Request body:

```json
{
  "gameName": "Otter Austin",
  "playerName": "Major Mischief"
}
```

Notes:

- `playerName` is required
- `gameName` is optional
- if `gameName` is blank or missing, the backend falls back to `Game <gameId>`
- the backend rejects creation when there are already 25 `waiting` or `active` games

Response:

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
    "createdAt": "2026-03-21T18:00:00.000Z",
    "updatedAt": "2026-03-21T18:00:00.000Z",
    "startedAt": null,
    "endedAt": null,
    "lastMoveAt": null
  },
  "participant": {
    "role": "player",
    "mark": "X",
    "playerId": "p_x_123"
  },
  "links": {
    "gameUrl": "https://app.example.com/game/g_123"
  }
}
```

### `GET /games/{id}`

Returns the current game snapshot plus ordered event history.

Response shape:

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
    "createdAt": "2026-03-21T18:00:00.000Z",
    "updatedAt": "2026-03-21T18:01:10.000Z",
    "startedAt": "2026-03-21T18:00:20.000Z",
    "endedAt": null,
    "lastMoveAt": "2026-03-21T18:01:10.000Z"
  },
  "players": {
    "X": { "joined": true },
    "O": { "joined": true }
  },
  "events": [
    {
      "sequenceNumber": 1,
      "eventType": "game_created",
      "createdAt": "2026-03-21T18:00:00.000Z",
      "payload": {}
    }
  ]
}
```

Notes:

- `events` are returned in repository order by `sequenceNumber`
- the `players` object only exposes join-state, not participant ids

### `GET /games?status=waiting|active|over`

Returns a status-filtered list of game summaries.

Response shape:

```json
{
  "games": [
    {
      "gameId": "g_123",
      "gameName": "Otter Austin",
      "status": "waiting",
      "createdAt": "2026-03-21T18:00:00.000Z",
      "updatedAt": "2026-03-21T18:00:00.000Z",
      "moveCount": 0,
      "winner": null,
      "terminalReason": null
    }
  ]
}
```

Notes:

- `status` is required and must be one of `waiting`, `active`, or `over`
- before returning results, the handler scans active games and auto-abandons stale ones if needed

### `POST /games/{id}/join`

Joins a waiting game as player `O`.

Request body:

```json
{
  "playerName": "Captain Curious"
}
```

Response shape:

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
    "gameUrl": "https://app.example.com/game/g_123"
  }
}
```

### `POST /games/{id}/moves`

Submits a move for the identified player.

Request body:

```json
{
  "playerId": "p_x_123",
  "square": 4
}
```

Response shape:

```json
{
  "game": {
    "gameId": "g_123",
    "gameName": "Otter Austin",
    "xPlayerName": "Major Mischief",
    "oPlayerName": "Captain Curious",
    "status": "active",
    "board": [null, null, null, null, "X", null, null, null, null],
    "nextMark": "O",
    "moveCount": 1,
    "winner": null,
    "terminalReason": null,
    "createdAt": "2026-03-21T18:00:00.000Z",
    "updatedAt": "2026-03-21T18:01:10.000Z",
    "startedAt": "2026-03-21T18:00:20.000Z",
    "endedAt": null,
    "lastMoveAt": "2026-03-21T18:01:10.000Z"
  },
  "event": {
    "sequenceNumber": 2,
    "eventType": "move_accepted",
    "createdAt": "2026-03-21T18:01:10.000Z",
    "payload": {
      "mark": "X",
      "position": 4,
      "playerId": "p_x_123"
    }
  }
}
```

Notes:

- `square` must be an integer
- gameplay validation is server-authoritative
- common conflict errors include `not_your_turn`, `invalid_move`, `game_not_active`, and `already_over`

### `POST /games/{id}/resign`

Ends an active game by resignation.

Request body:

```json
{
  "playerId": "p_x_123"
}
```

Response shape:

```json
{
  "game": {
    "gameId": "g_123",
    "gameName": "Otter Austin",
    "xPlayerName": "Major Mischief",
    "oPlayerName": "Captain Curious",
    "status": "over",
    "board": ["X", null, null, null, "O", null, null, null, null],
    "nextMark": null,
    "moveCount": 2,
    "winner": "O",
    "terminalReason": "resignation",
    "createdAt": "2026-03-21T18:00:00.000Z",
    "updatedAt": "2026-03-21T18:02:00.000Z",
    "startedAt": "2026-03-21T18:00:20.000Z",
    "endedAt": "2026-03-21T18:02:00.000Z",
    "lastMoveAt": "2026-03-21T18:01:10.000Z"
  }
}
```

### `POST /games/{id}/spectate`

Returns spectator access information for a game.

Request body:

```json
{}
```

Response shape:

```json
{
  "spectator": {
    "spectatorId": "s_123"
  },
  "game": {
    "gameId": "g_123",
    "gameName": "Otter Austin",
    "status": "active"
  },
  "websocket": {
    "gameId": "g_123"
  }
}
```

Notes:

- the handler does not require a player identity
- the response is intentionally lightweight; full board state comes from `GET /games/{id}`

### `POST /games/{id}/abandonment-check`

Allows a player to ask the server to resolve an idle-turn abandonment decision.

Request body:

```json
{
  "playerId": "p_x_123"
}
```

Response shape when abandoned:

```json
{
  "abandonmentChecked": true,
  "game": {
    "gameId": "g_123",
    "status": "over",
    "winner": "O",
    "terminalReason": "abandonment"
  }
}
```

Response shape when not abandoned:

```json
{
  "abandonmentChecked": true,
  "game": {
    "gameId": "g_123",
    "status": "active",
    "winner": null,
    "terminalReason": null
  },
  "result": "not_abandoned"
}
```

Notes:

- if auto-abandonment already resolved the game earlier in the request flow, the handler returns the resolved game immediately

## WebSocket API

### Routes

- `$connect`
- `$disconnect`
- `$default`

### Connect query parameters

The connect handler expects:

- `gameId` required
- `participantType` optional, `player` or defaults to `spectator`
- `participantId` optional, defaults to `anonymous`

Example connection URL:

```text
wss://<websocket-host>/prod?gameId=g_123&participantType=player&participantId=p_x_123
```

### Connect behavior

On `$connect`, the backend stores:

- `gameId`
- `connectionId`
- `participantType`
- `participantId`
- `connectedAt`
- `ttl`

TTL is currently set to 24 hours from connection time.

### Disconnect behavior

On `$disconnect`, the backend looks up the connection by `connectionId` and removes it from the `connections` table.

### Default behavior

The `$default` route returns `200` with an empty body and does not process application messages.

### Broadcast envelope

When the backend broadcasts multiplayer events, each message uses this shape:

```json
{
  "type": "move_accepted",
  "gameId": "g_123",
  "sequenceNumber": 2,
  "createdAt": "2026-03-21T18:01:10.000Z",
  "data": {
    "mark": "X",
    "position": 4,
    "playerId": "p_x_123"
  }
}
```

Notes:

- every persisted gameplay event is broadcast to every subscribed connection for the game
- stale API Gateway connections are removed when the publisher receives a `GoneException`

## Persistence Model

### `games`

Stores the latest multiplayer game snapshot, including:

- player names and player ids
- board state
- status and terminal outcome
- timestamps
- last event sequence number

### `game_events`

Stores ordered multiplayer events keyed by:

- partition key: `gameId`
- sort key: `sequenceNumber`

### `connections`

Stores live WebSocket subscriber records keyed by:

- partition key: `gameId`
- sort key: `connectionId`

Records also include `participantType`, `participantId`, `connectedAt`, and `ttl`.

## Current Operational Rules

- The backend caps `waiting` + `active` games at 25
- Player identities are game-scoped capability ids, not user accounts
- Spectator ids are lightweight tokens returned by the spectate handler
- WebSockets are used only for live event delivery, not for replay hydration
- Replay and catch-up data come from `GET /games/{id}`
