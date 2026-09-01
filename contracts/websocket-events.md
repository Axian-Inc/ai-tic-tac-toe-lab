# WebSocket Events

Status: accepted for Phase 2

The WebSocket endpoint is `/ws`. A connection may observe multiple games by
sending one subscription request per game. Spectators do not need a seat
capability; all state-changing commands remain HTTP-only and capability
protected.

## Client subscription

```json
{
  "version": 1,
  "action": "subscribe",
  "requestId": "b35bc18a-b87f-46d8-bf2e-bca4c12619b0",
  "gameId": "01K5QX4Q6G4V8N0J57Z2Y4C8JM",
  "afterSequence": 7
}
```

`requestId` is a client-generated UUID used only to correlate the control
response. `afterSequence` is the last contiguous sequence the client has
applied and defaults to `0`.

The service registers the subscription before reading authoritative state.
It then sends `subscription.accepted`:

```json
{
  "version": 1,
  "type": "subscription.accepted",
  "requestId": "b35bc18a-b87f-46d8-bf2e-bca4c12619b0",
  "gameId": "01K5QX4Q6G4V8N0J57Z2Y4C8JM",
  "throughSequence": 9,
  "snapshot": {
    "id": "01K5QX4Q6G4V8N0J57Z2Y4C8JM",
    "status": "active",
    "sequence": 9
  }
}
```

The real snapshot uses the complete OpenAPI `GameSnapshot` schema. The client
uses `throughSequence` as the snapshot/tail boundary. A subscription to an
unknown game or invalid cursor returns:

```json
{
  "version": 1,
  "type": "subscription.rejected",
  "requestId": "b35bc18a-b87f-46d8-bf2e-bca4c12619b0",
  "gameId": "01K5QX4Q6G4V8N0J57Z2Y4C8JM",
  "code": "game_not_found",
  "detail": "The requested game does not exist."
}
```

Stable rejection codes are `invalid_message`, `unsupported_version`,
`game_not_found`, and `invalid_cursor`.

## Durable game event

Every accepted command produces exactly one durable envelope:

```json
{
  "version": 1,
  "type": "game.event",
  "eventId": "01K5QX6K4B6ZEJQ4A08G3F7TCA",
  "gameId": "01K5QX4Q6G4V8N0J57Z2Y4C8JM",
  "sequence": 10,
  "occurredAt": "2026-08-31T20:15:30.125Z",
  "eventType": "move.accepted",
  "data": {
    "player": "X",
    "cell": 6,
    "ply": 5
  },
  "state": {
    "id": "01K5QX4Q6G4V8N0J57Z2Y4C8JM",
    "status": "over",
    "sequence": 10,
    "winner": "X",
    "endReason": "line"
  }
}
```

The real `state` uses the complete OpenAPI `GameSnapshot` schema. Accepted
`eventType` values are `game.created`, `player.joined`, `move.accepted`,
`game.resigned`, `game.abandoned`, and `game.cancelled`.

## Delivery guarantee and recovery

Delivery is at least once. A message may be duplicated, delayed, or arrive out
of order. The server persists before attempting broadcast. Clients:

1. ignore an event whose sequence is already applied;
2. apply only the next contiguous sequence;
3. buffer a future sequence;
4. call `GET /api/v1/games/{gameId}/events?afterSequence=<last>` when a gap is
   observed or after reconnect;
5. resume live application only after the gap is closed through the
   subscription's `throughSequence`.

API Gateway delivery failure never changes game state. A management API 410
response removes the stale connection/subscription records. Other publication
failures are logged and metered for recovery through replay.
