````md
# Tic-Tac-Toe Multiplayer Backend API Requirements

## Purpose

This document defines the **authoritative backend API requirements** for a multiplayer tic-tac-toe system.

The backend must:

- Be implemented in **Node.js**
- Provide an **HTTP API** for commands and queries
- Provide a **WebSocket API** for real-time updates
- Act as the **single source of truth** for all gameplay
- Enforce all game rules strictly
- Support spectators and replayability
- Operate within defined resource constraints

---

# System Constraints

## SC-001: Technology

- The backend must be implemented in **Node.js**
- TypeScript is strongly recommended

## SC-002: Concurrency Limit

- The system must allow a maximum of **25 concurrent multiplayer games**
- Concurrent games include:
  - `"waiting_for_players"`
  - `"active"`

If the limit is exceeded:

- The server must return HTTP `429`

## SC-003: No Authentication

- The system must not implement authentication or accounts
- The system must rely on:
  - `playerToken` for authority
  - `displayName` for identification

---

# Identity Model

## Display Name

Users may provide a display name such as `"bob123"`.

### Requirements

- Must be validated
- Must be stored with:
  - player seats
  - spectators
  - move events
- Must not be used for authorization

### Validation Rules

```ts
minLength = 1
maxLength = 24
pattern = /^[a-zA-Z0-9_-]+$/
````

### Constraints

* Not globally unique
* Must be unique among players within a game
* Spectators may reuse names

---

## Player Token

* Issued by the server
* Required for:

  * making moves
  * resigning
  * abandonment checks
* Must not be guessable
* Must be treated as a capability

---

# Game Model

## Game State

```ts
type GameState =
  | "waiting_for_players"
  | "active"
  | "won"
  | "draw"
  | "resigned"
  | "abandoned";
```

## Game Structure

```ts
type Game = {
  id: string;
  state: GameState;
  board: ( "X" | "O" | null )[];
  currentTurn: "X" | "O" | null;
  winner: "X" | "O" | null;
  players: {
    X?: PlayerSeat;
    O?: PlayerSeat;
  };
  moveHistory: MoveRecord[];
  eventHistory: GameEvent[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  lastMoveAt: string | null;
  abandonmentDeadlineAt: string | null;
};
```

---

# Core Server Rules

## SR-001: Server Authority

* The server is the sole authority on game state
* Clients may only **suggest actions**

## SR-002: Move Validation

Every move must be validated server-side:

* correct turn
* valid cell index
* empty cell
* active game

## SR-003: Event Consistency

* Every state change must produce an event
* Every event must be persisted
* No event may contradict game state

## SR-004: Replayability

The system must persist enough data to:

* replay games
* reconstruct state
* allow spectators to catch up

## SR-005: Spectator Support

Spectators must be able to:

* subscribe to games
* receive real-time updates
* fetch full history

Spectators must not:

* perform player actions

---

# Game Lifecycle

## Creation

* Game starts in `"waiting_for_players"`
* Creator is assigned `"X"` or `"O"` randomly

## Joining

* Second player joins
* Game becomes `"active"`
* Starting player is randomly selected

## Gameplay

* Players alternate turns
* Moves are validated and applied

## End Conditions

### Win

* Standard tic-tac-toe rules

### Draw

* Board full, no winner

### Resignation

* Player resigns → other player wins

### Abandonment

* No move for 3 minutes

---

# Abandonment Rules

## Timeout

* 3 minutes per turn

## Behavior

If timeout exceeded:

* game becomes `"abandoned"`
* current player loses
* other player wins

## Trigger

* automatic OR
* via explicit API call

---

# HTTP API

## Base Path

```
/api
```

---

## GET /health

### Response

```json
{ "status": "ok" }
```

---

## POST /games

### Request

```json
{
  "displayName": "bob123"
}
```

### Response

```json
{
  "game": { ... },
  "player": {
    "mark": "X",
    "displayName": "bob123",
    "playerToken": "token"
  }
}
```

### Errors

* `400 INVALID_DISPLAY_NAME`
* `429 GAME_LIMIT_REACHED`

---

## POST /games/:gameId/join

### Request

```json
{
  "displayName": "alice456"
}
```

### Response

```json
{
  "game": { ... },
  "player": {
    "mark": "O",
    "displayName": "alice456",
    "playerToken": "token"
  }
}
```

### Errors

* `404 GAME_NOT_FOUND`
* `409 GAME_ALREADY_FULL`
* `409 DISPLAY_NAME_ALREADY_USED`

---

## GET /games/:gameId

Returns current game state.

---

## GET /games/:gameId/events

Returns event history.

---

## POST /games/:gameId/moves

### Request

```json
{
  "playerToken": "token",
  "cellIndex": 4
}
```

### Response

```json
{
  "accepted": true,
  "game": { ... }
}
```

### Errors

* `401 INVALID_PLAYER_TOKEN`
* `403 NOT_YOUR_TURN`
* `409 CELL_OCCUPIED`
* `409 GAME_NOT_ACTIVE`

---

## POST /games/:gameId/resign

### Request

```json
{
  "playerToken": "token"
}
```

### Response

```json
{
  "game": {
    "state": "resigned",
    "winner": "X"
  }
}
```

---

## POST /games/:gameId/abandonment-check

### Request

```json
{
  "playerToken": "token"
}
```

### Response

```json
{
  "abandoned": true,
  "game": { ... }
}
```

---

# WebSocket API

## Endpoint

```
/ws
```

---

## Subscribe

### Player

```json
{
  "type": "subscribe",
  "gameId": "game_123",
  "role": "player",
  "playerToken": "token"
}
```

### Spectator

```json
{
  "type": "subscribe",
  "gameId": "game_123",
  "role": "spectator",
  "displayName": "viewer99"
}
```

---

# WebSocket Events

## move.accepted

* broadcast after valid move

## game.won

* includes winner and board

## game.draw

* includes final board

## game.resigned

* includes resigning player and winner

## game.abandoned

* includes timeout loser and winner

---

# Storage Requirements

The system must persist:

* games
* move history
* event history
* player display names

---

# Testing Requirements

## Must Cover

### Game Creation Limit

* 25 concurrent games enforced

### Move Validation

* valid moves accepted
* invalid moves rejected

### Win Conditions

All 8 win patterns tested

### Draw

* correct detection

### Resignation

* correct winner

### Abandonment

* timeout enforcement
* correct winner

### Replay

* event history reconstructs game

### WebSockets

* move broadcast
* end-game broadcast

---

# Non-Negotiable Rules

The system must never:

* trust client state
* accept invalid moves
* allow >25 concurrent games
* allow spectators to act as players
* allow moves after game end
* lose event history
* produce inconsistent state/events

---

# Summary

This API defines a:

* server-authoritative
* event-driven
* replayable
* real-time multiplayer

tic-tac-toe backend with strict validation, low-cost scalability, and deterministic behavior.

```
```


---

# Stories

````md
# Backend API Implementation Stories

## Story 1: Create a Multiplayer Game

As a client, I want to create a new multiplayer game so that a player can start a tic-tac-toe match.

### Acceptance Criteria

**Given**
- fewer than 25 concurrent games exist
- the request includes a valid `displayName`

**When**
- `POST /api/games` is called

**Then**
- the response status is `201`
- the response includes a `game.id`
- the game state is `"waiting_for_players"`
- the board contains 9 `null` values
- the response includes a `playerToken`
- the player mark is either `"X"` or `"O"`
- the display name is stored with the player seat

```ts
expect(response.status).toBe(201);
expect(response.body.game.id).toBeDefined();
expect(response.body.game.state).toBe("waiting_for_players");
expect(response.body.game.board).toEqual(Array(9).fill(null));
expect(response.body.player.playerToken).toBeDefined();
expect(["X", "O"]).toContain(response.body.player.mark);
expect(response.body.player.displayName).toBe("bob123");
````

---

## Story 2: Reject Invalid Display Names

As a server, I want to reject invalid display names so that unsafe or unsupported identifiers are not stored.

### Acceptance Criteria

**Given**

* a game creation request contains an invalid `displayName`

**When**

* `POST /api/games` is called

**Then**

* the response status is `400`
* the error code is `"INVALID_DISPLAY_NAME"`
* no game is created

```ts
expect(response.status).toBe(400);
expect(response.body.error.code).toBe("INVALID_DISPLAY_NAME");
```

Invalid examples must include:

```ts
["", "bad name", "<script>", "a".repeat(25)]
```

---

## Story 3: Enforce Maximum Concurrent Games

As a server, I want to limit concurrent multiplayer games to 25 so that the backend stays within low-cost resource constraints.

### Acceptance Criteria

**Given**

* 25 games exist in `"waiting_for_players"` or `"active"` state

**When**

* `POST /api/games` is called

**Then**

* the response status is `429`
* the error code is `"GAME_LIMIT_REACHED"`
* no additional game is created

```ts
expect(response.status).toBe(429);
expect(response.body.error.code).toBe("GAME_LIMIT_REACHED");
```

---

## Story 4: Join an Existing Game

As a second player, I want to join a waiting game so that the game can begin.

### Acceptance Criteria

**Given**

* a game exists in `"waiting_for_players"` state
* one player seat is occupied
* the joining user provides a valid, unique display name

**When**

* `POST /api/games/:gameId/join` is called

**Then**

* the response status is `200`
* the joining player receives the unoccupied mark
* the game state becomes `"active"`
* `currentTurn` is either `"X"` or `"O"`
* the board remains empty
* a `game.joined` event is persisted

```ts
expect(response.status).toBe(200);
expect(["X", "O"]).toContain(response.body.player.mark);
expect(response.body.game.state).toBe("active");
expect(["X", "O"]).toContain(response.body.game.currentTurn);
expect(response.body.game.board).toEqual(Array(9).fill(null));
```

---

## Story 5: Reject Join When Game Is Full

As a server, I want to reject attempts to join a full game so that no game has more than two players.

### Acceptance Criteria

**Given**

* a game already has players `"X"` and `"O"`

**When**

* `POST /api/games/:gameId/join` is called

**Then**

* the response status is `409`
* the error code is `"GAME_ALREADY_FULL"`

```ts
expect(response.status).toBe(409);
expect(response.body.error.code).toBe("GAME_ALREADY_FULL");
```

---

## Story 6: Reject Duplicate Player Display Name Within Same Game

As a server, I want player display names to be unique within a game so that players are distinguishable.

### Acceptance Criteria

**Given**

* player `"X"` has display name `"bob123"`

**When**

* another player attempts to join the same game with display name `"bob123"`

**Then**

* the response status is `409`
* the error code is `"DISPLAY_NAME_ALREADY_USED"`

```ts
expect(response.status).toBe(409);
expect(response.body.error.code).toBe("DISPLAY_NAME_ALREADY_USED");
```

---

## Story 7: Fetch Current Game State

As a client, I want to fetch the current game state so that I can render or recover the latest game view.

### Acceptance Criteria

**Given**

* a game exists

**When**

* `GET /api/games/:gameId` is called

**Then**

* the response status is `200`
* the response includes board state
* the response includes game state
* the response includes current turn
* the response includes players and display names
* the response includes move history

```ts
expect(response.status).toBe(200);
expect(response.body.game.id).toBe(gameId);
expect(response.body.game.board).toHaveLength(9);
expect(response.body.game.state).toBeDefined();
expect(response.body.game.players).toBeDefined();
expect(response.body.game.moveHistory).toBeDefined();
```

---

## Story 8: Reject Fetch for Unknown Game

As a client, I want a clear error when fetching a missing game so that I can handle invalid links.

### Acceptance Criteria

**Given**

* no game exists with the requested id

**When**

* `GET /api/games/:gameId` is called

**Then**

* the response status is `404`
* the error code is `"GAME_NOT_FOUND"`

```ts
expect(response.status).toBe(404);
expect(response.body.error.code).toBe("GAME_NOT_FOUND");
```

---

## Story 9: Submit a Valid Move

As a player, I want to submit a move so that I can play my turn.

### Acceptance Criteria

**Given**

* the game is `"active"`
* it is the player's turn
* the target cell is empty
* the request includes the correct `playerToken`

**When**

* `POST /api/games/:gameId/moves` is called

**Then**

* the response status is `200`
* `accepted` is `true`
* the selected cell contains the player's mark
* move history contains the move
* a `move.accepted` event is persisted
* listeners receive a `move.accepted` WebSocket event

```ts
expect(response.status).toBe(200);
expect(response.body.accepted).toBe(true);
expect(response.body.game.board[cellIndex]).toBe(playerMark);
expect(response.body.move.cellIndex).toBe(cellIndex);
expect(response.body.move.playerMark).toBe(playerMark);
```

---

## Story 10: Reject Move With Invalid Player Token

As a server, I want to reject moves without a valid player token so that display names cannot be used as authority.

### Acceptance Criteria

**Given**

* a game is `"active"`

**When**

* a move request uses a missing or invalid `playerToken`

**Then**

* the response status is `401`
* the error code is `"INVALID_PLAYER_TOKEN"`
* the board is unchanged
* move history is unchanged

```ts
expect(response.status).toBe(401);
expect(response.body.error.code).toBe("INVALID_PLAYER_TOKEN");
expect(updatedGame.board).toEqual(previousBoard);
expect(updatedGame.moveHistory).toEqual(previousMoveHistory);
```

---

## Story 11: Reject Out-of-Turn Move

As a server, I want to reject moves from the wrong player so that turn order is enforced.

### Acceptance Criteria

**Given**

* the game is `"active"`
* `currentTurn` is `"X"`

**When**

* player `"O"` submits a move

**Then**

* the response status is `403`
* the error code is `"NOT_YOUR_TURN"`
* the board is unchanged
* move history is unchanged

```ts
expect(response.status).toBe(403);
expect(response.body.error.code).toBe("NOT_YOUR_TURN");
expect(updatedGame.board).toEqual(previousBoard);
expect(updatedGame.moveHistory).toEqual(previousMoveHistory);
```

---

## Story 12: Reject Occupied Cell Move

As a server, I want to reject moves to occupied cells so that marks cannot be overwritten.

### Acceptance Criteria

**Given**

* the game is `"active"`
* cell `0` already contains `"X"`

**When**

* a player attempts to play cell `0`

**Then**

* the response status is `409`
* the error code is `"CELL_OCCUPIED"`
* the board is unchanged

```ts
expect(response.status).toBe(409);
expect(response.body.error.code).toBe("CELL_OCCUPIED");
expect(updatedGame.board).toEqual(previousBoard);
```

---

## Story 13: Reject Invalid Cell Index

As a server, I want to reject invalid cell indexes so that moves can only target the 3x3 board.

### Acceptance Criteria

**Given**

* the game is `"active"`

**When**

* a move request uses `cellIndex` `-1` or `9`

**Then**

* the response status is `400`
* the error code is `"INVALID_CELL_INDEX"`
* the board is unchanged

```ts
expect(response.status).toBe(400);
expect(response.body.error.code).toBe("INVALID_CELL_INDEX");
expect(updatedGame.board).toEqual(previousBoard);
```

---

## Story 14: Detect Horizontal Wins

As a server, I want to detect horizontal wins so that games end correctly.

### Acceptance Criteria

**Given**

* a player completes any horizontal winning line

**When**

* the winning move is accepted

**Then**

* the game state becomes `"won"`
* the winner is the acting player
* a `game.won` event is persisted
* no further moves are accepted

Horizontal lines:

```ts
[
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
]
```

```ts
expect(response.body.game.state).toBe("won");
expect(response.body.game.winner).toBe(playerMark);
expect(nextMoveResponse.status).toBe(409);
expect(nextMoveResponse.body.error.code).toBe("GAME_NOT_ACTIVE");
```

---

## Story 15: Detect Vertical Wins

As a server, I want to detect vertical wins so that games end correctly.

### Acceptance Criteria

Vertical lines:

```ts
[
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
]
```

For each line:

```ts
expect(response.body.game.state).toBe("won");
expect(response.body.game.winner).toBe(playerMark);
```

---

## Story 16: Detect Diagonal Wins

As a server, I want to detect diagonal wins so that games end correctly.

### Acceptance Criteria

Diagonal lines:

```ts
[
  [0, 4, 8],
  [2, 4, 6],
]
```

For each line:

```ts
expect(response.body.game.state).toBe("won");
expect(response.body.game.winner).toBe(playerMark);
```

---

## Story 17: Detect Draw

As a server, I want to detect a draw so that a full board with no winner ends the game.

### Acceptance Criteria

**Given**

* the board has 8 occupied cells
* no winning line exists
* the final move fills the last empty cell
* the final move does not create a winning line

**When**

* the final move is accepted

**Then**

* the game state becomes `"draw"`
* the winner is `null`
* a `game.draw` event is persisted
* no further moves are accepted

```ts
expect(response.body.game.state).toBe("draw");
expect(response.body.game.winner).toBeNull();
expect(response.body.game.board.includes(null)).toBe(false);
```

---

## Story 18: Resign an Active Game

As a player, I want to resign so that I can intentionally end the game.

### Acceptance Criteria

**Given**

* the game is `"active"`
* the request includes a valid `playerToken`

**When**

* `POST /api/games/:gameId/resign` is called

**Then**

* the response status is `200`
* the game state becomes `"resigned"`
* the non-resigning player is the winner
* a `game.resigned` event is persisted
* listeners receive a `game.resigned` WebSocket event
* no further moves are accepted

```ts
expect(response.status).toBe(200);
expect(response.body.game.state).toBe("resigned");
expect(response.body.game.winner).toBe(otherPlayerMark);
expect(nextMoveResponse.status).toBe(409);
expect(nextMoveResponse.body.error.code).toBe("GAME_NOT_ACTIVE");
```

---

## Story 19: Reject Spectator Player Actions

As a server, I want spectators to be unable to perform player commands so that only seated players can affect game state.

### Acceptance Criteria

**Given**

* a spectator is subscribed to a game
* the spectator does not have a player token

**When**

* the spectator attempts to make a move or resign

**Then**

* the response status is `401`
* the error code is `"INVALID_PLAYER_TOKEN"`
* the game state is unchanged

```ts
expect(response.status).toBe(401);
expect(response.body.error.code).toBe("INVALID_PLAYER_TOKEN");
expect(updatedGame).toMatchObject(previousGameState);
```

---

## Story 20: Check Abandonment Before Timeout

As a player, I want to check whether a game has been abandoned so that the server can decide if the current player timed out.

### Acceptance Criteria

**Given**

* the game is `"active"`
* the abandonment deadline has not passed
* the request includes a valid `playerToken`

**When**

* `POST /api/games/:gameId/abandonment-check` is called

**Then**

* the response status is `200`
* `abandoned` is `false`
* the game remains `"active"`
* no abandonment event is persisted

```ts
expect(response.status).toBe(200);
expect(response.body.abandoned).toBe(false);
expect(response.body.game.state).toBe("active");
```

---

## Story 21: Check Abandonment After Timeout

As a player, I want the server to mark a timed-out game as abandoned so that the waiting player can win.

### Acceptance Criteria

**Given**

* the game is `"active"`
* the abandonment deadline has passed
* it is player `"O"`'s turn
* the request includes a valid player token from either seated player

**When**

* `POST /api/games/:gameId/abandonment-check` is called

**Then**

* the response status is `200`
* `abandoned` is `true`
* the game state becomes `"abandoned"`
* player `"O"` loses
* player `"X"` wins
* a `game.abandoned` event is persisted
* listeners receive a `game.abandoned` WebSocket event
* no further moves are accepted

```ts
expect(response.status).toBe(200);
expect(response.body.abandoned).toBe(true);
expect(response.body.game.state).toBe("abandoned");
expect(response.body.game.winner).toBe("X");
```

---

## Story 22: Refresh Abandonment Deadline After Move

As a server, I want to refresh the abandonment deadline after each accepted move so that the next player has 3 minutes to act.

### Acceptance Criteria

**Given**

* the game is `"active"`
* player `"X"` makes a valid move

**When**

* the move is accepted

**Then**

* `currentTurn` becomes `"O"`
* `abandonmentDeadlineAt` is updated
* the new abandonment deadline is approximately 3 minutes after the move time

```ts
expect(response.body.game.currentTurn).toBe("O");

const deadline = new Date(response.body.game.abandonmentDeadlineAt).getTime();
const now = Date.now();

expect(deadline).toBeGreaterThanOrEqual(now + 179_000);
expect(deadline).toBeLessThanOrEqual(now + 181_000);
```

---

## Story 23: Subscribe to Game as Player

As a player, I want to subscribe to my game over WebSocket so that I receive real-time updates.

### Acceptance Criteria

**Given**

* a game exists
* the client has a valid player token

**When**

* the client sends a WebSocket `subscribe` message with role `"player"`

**Then**

* the server responds with `subscription.confirmed`
* the response includes the game id
* the response includes the latest event sequence

```ts
expect(message.type).toBe("subscription.confirmed");
expect(message.gameId).toBe(gameId);
expect(message.latestSequence).toEqual(expect.any(Number));
```

---

## Story 24: Subscribe to Game as Spectator

As a spectator, I want to subscribe to a game so that I can watch without affecting gameplay.

### Acceptance Criteria

**Given**

* a game exists
* the spectator provides a valid display name

**When**

* the client sends a WebSocket `subscribe` message with role `"spectator"`

**Then**

* the server responds with `subscription.confirmed`
* the spectator receives future game events
* the spectator does not receive a player token

```ts
expect(message.type).toBe("subscription.confirmed");
expect(message.role).toBe("spectator");
expect(message.playerToken).toBeUndefined();
```

---

## Story 25: Broadcast Move Events

As a listener, I want to receive move events so that my client stays synchronized.

### Acceptance Criteria

**Given**

* player `"X"`, player `"O"`, and one spectator are subscribed to a game

**When**

* player `"X"` makes a valid move through the HTTP API

**Then**

* all subscribed clients receive a `move.accepted` event
* the event includes the game id
* the event includes move number
* the event includes player mark
* the event includes display name
* the event includes cell index
* the event includes updated board
* the event sequence is greater than the previous sequence

```ts
expect(event.type).toBe("move.accepted");
expect(event.gameId).toBe(gameId);
expect(event.payload.playerMark).toBe("X");
expect(event.payload.displayName).toBe("bob123");
expect(event.payload.cellIndex).toBe(0);
expect(event.payload.board[0]).toBe("X");
expect(event.sequence).toBeGreaterThan(previousSequence);
```

---

## Story 26: Broadcast Game End Events

As a listener, I want to receive game end events so that my client can display final results.

### Acceptance Criteria

**Given**

* listeners are subscribed to a game

**When**

* the game ends by win, draw, resignation, or abandonment

**Then**

* listeners receive the matching event type:

  * `"game.won"`
  * `"game.draw"`
  * `"game.resigned"`
  * `"game.abandoned"`
* the event includes final game result data
* the event is persisted before or atomically with broadcast

```ts
expect(["game.won", "game.draw", "game.resigned", "game.abandoned"]).toContain(event.type);
expect(event.gameId).toBe(gameId);
expect(event.sequence).toEqual(expect.any(Number));
```

---

## Story 27: Fetch Event History

As a client, I want to fetch event history so that I can catch up or replay a game.

### Acceptance Criteria

**Given**

* a game has persisted events

**When**

* `GET /api/games/:gameId/events` is called

**Then**

* the response status is `200`
* events are returned in ascending sequence order
* each event includes `sequence`, `type`, `gameId`, and `createdAt`

```ts
expect(response.status).toBe(200);
expect(response.body.events.length).toBeGreaterThan(0);

const sequences = response.body.events.map((event) => event.sequence);
expect(sequences).toEqual([...sequences].sort((a, b) => a - b));

for (const event of response.body.events) {
  expect(event.gameId).toBe(gameId);
  expect(event.sequence).toEqual(expect.any(Number));
  expect(event.type).toEqual(expect.any(String));
  expect(event.createdAt).toBeDefined();
}
```

---

## Story 28: Fetch Event History After Sequence

As a reconnecting client, I want to fetch only events after a known sequence so that I can catch up efficiently.

### Acceptance Criteria

**Given**

* a game has events with sequences `1`, `2`, and `3`

**When**

* `GET /api/games/:gameId/events?afterSequence=1` is called

**Then**

* the response status is `200`
* only events with sequence greater than `1` are returned

```ts
expect(response.status).toBe(200);
expect(response.body.events.every((event) => event.sequence > 1)).toBe(true);
```

---

## Story 29: Preserve Replay Data for Completed Games

As a client, I want completed games to retain event history so that old games can be replayed.

### Acceptance Criteria

**Given**

* a game has ended

**When**

* `GET /api/games/:gameId/events` is called

**Then**

* the response status is `200`
* the event history includes creation, join, moves, and final result event
* display names are included where applicable

```ts
expect(response.status).toBe(200);
expect(response.body.events.some((e) => e.type === "game.created")).toBe(true);
expect(response.body.events.some((e) => e.type === "game.joined")).toBe(true);
expect(response.body.events.some((e) => e.type.startsWith("game."))).toBe(true);
```

---

## Story 30: Ensure Event and State Consistency

As a server, I want persisted events to match game state so that replay never contradicts the authoritative game.

### Acceptance Criteria

**Given**

* a move is accepted

**When**

* the game state and latest event are fetched

**Then**

* the latest event board matches the stored game board
* the latest event current turn matches the stored game current turn
* the latest event state matches the stored game state

```ts
expect(latestEvent.payload.board).toEqual(game.board);
expect(latestEvent.payload.currentTurn).toBe(game.currentTurn);
expect(latestEvent.payload.state).toBe(game.state);
```

---

## Story 31: Health Check

As an operator, I want a health endpoint so that infrastructure can determine whether the server is running.

### Acceptance Criteria

**When**

* `GET /api/health` is called

**Then**

* the response status is `200`
* the response body equals `{ "status": "ok" }`

```ts
expect(response.status).toBe(200);
expect(response.body).toEqual({ status: "ok" });
```

```
```
