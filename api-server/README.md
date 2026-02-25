# Tic-Tac-Toe API Server

A TypeScript Node HTTP API server for multiplayer tic-tac-toe sessions.

## Run (Dev)

```bash
cd api-server
npm install
npm run dev
```

## Build + Run (Prod-style)

```bash
cd api-server
npm run build
npm start
```

## Typecheck

```bash
cd api-server
npm run typecheck
```

The server listens on `http://localhost:4000` by default.

## Test

```bash
cd api-server
npm test
```

## API

### `GET /health`
Returns `{ "ok": true }`.

### `POST /games`
Creates a new game and assigns the caller as player `X`.

Example response:

```json
{
  "game": {
    "id": "...",
    "board": [null, null, null, null, null, null, null, null, null],
    "nextTurn": "X",
    "winner": null,
    "isDraw": false,
    "status": "waiting",
    "players": { "X": true, "O": false },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "assignedSymbol": "X",
  "playerId": "..."
}
```

### `POST /games/:gameId/join`
Joins an existing game as player `O`.

### `GET /games/:gameId`
Returns current public game state.

### `POST /games/:gameId/moves`
Makes a move for the authenticated player token.

Request body:

```json
{
  "playerId": "...",
  "position": 0
}
```

### `POST /games/:gameId/leave`
Marks a player as having left the game.

- If no moves have been made yet, the game stays `waiting`.
- If moves have already happened, the game transitions to `over` with `completedReason: "player_left"`.

### `GET /wstest?gameId=...` (WebSocket upgrade)
Subscribes a client to events for a single game.

Events:
- `subscription.confirmed`
- `game.joined`
- `game.updated`
