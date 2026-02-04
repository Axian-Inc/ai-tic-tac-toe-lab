# API Contract (Phase 2)

## Transport
- HTTP for create/join and initial state fetch.
- WebSocket for realtime events.
- JSON message envelopes.

## Game states
- `waiting` (created, waiting for opponent)
- `active` (in progress)
- `over` (completed)

## Message envelope
```
{
  "type": "<event|command>",
  "payload": { ... },
  "timestamp": "ISO-8601"
}
```

## Commands (client -> server)

### `create_game`
```
{
  "type": "create_game",
  "payload": { "playerId": "<id>" }
}
```

### `join_game`
```
{
  "type": "join_game",
  "payload": { "roomId": "<room>", "playerId": "<id>" }
}
```

### `make_move`
```
{
  "type": "make_move",
  "payload": { "roomId": "<room>", "playerId": "<id>", "index": 0 }
}
```

### `resign_game`
```
{
  "type": "resign_game",
  "payload": { "roomId": "<room>", "playerId": "<id>" }
}
```

### `abandonment_check`
```
{
  "type": "abandonment_check",
  "payload": { "roomId": "<room>" }
}
```

## Events (server -> client)

### `game_created`
```
{
  "type": "game_created",
  "payload": {
    "roomId": "<room>",
    "state": { "status": "waiting", "board": [], "moves": [] },
    "players": [{ "id": "<id>", "mark": "X" }]
  }
}
```

### `player_joined`
```
{
  "type": "player_joined",
  "payload": {
    "roomId": "<room>",
    "state": { "status": "active", "board": [], "moves": [] },
    "players": [{ "id": "<id>", "mark": "X" }, { "id": "<id>", "mark": "O" }]
  }
}
```

### `move_accepted`
```
{
  "type": "move_accepted",
  "payload": {
    "roomId": "<room>",
    "state": { "status": "active", "board": [], "moves": [] },
    "move": { "playerId": "<id>", "index": 0, "turn": 1 },
    "currentTurn": "<playerId>"
  }
}
```

### `move_rejected`
```
{
  "type": "move_rejected",
  "payload": {
    "roomId": "<room>",
    "error": { "code": "ILLEGAL_MOVE", "message": "Cell occupied." }
  }
}
```

### `game_over`
```
{
  "type": "game_over",
  "payload": {
    "roomId": "<room>",
    "state": { "status": "over", "board": [], "moves": [] },
    "winner": "<playerId|null>",
    "reason": "win|draw|resign|abandon"
  }
}
```

### `abandoned`
```
{
  "type": "abandoned",
  "payload": {
    "roomId": "<room>",
    "state": { "status": "over", "board": [], "moves": [] },
    "reason": "abandon"
  }
}
```

## Error shapes and status codes (HTTP)
- `400` invalid request (`{ code, message }`)
- `404` room not found (`{ code, message }`)
- `409` conflict (wrong turn, illegal move)
- `410` game over (`{ code, message }`)

## State payload requirements
Each event includes enough data for:
- State catch-up (`state`, `currentTurn`, `players`)
- Spectator view (`state`, `players`, `moves`)
- Move history replay (`moves` with turn order)

## Notes
- Server is authoritative for legal moves and turn order.
- Clients should handle out-of-order or duplicate events idempotently.
