# Web client

The Vite/React client supports both the Phase 1 deterministic local game and
the Phase 2 server-authoritative multiplayer flow. Local play never depends on
the API.

## Multiplayer configuration

Set these variables when running or building the client:

- `VITE_API_BASE_URL`: HTTP API origin, for example `https://api.example.com`.
  The client appends the frozen `/api/v1` prefix.
- `VITE_WS_URL`: complete WebSocket endpoint, including `/ws`, for example
  `wss://socket.example.com/ws`.

The multiplayer action remains visibly unavailable when either value is
missing. Seat capabilities returned by create/join are held only in React
memory. They are sent only in the `Authorization` header for player commands
and are lost on a page refresh by design because Phase 2 has no user identity
or durable session.

The client subscribes with its last applied sequence, ignores duplicate
events, buffers future events, and calls the HTTP events endpoint to fill a
gap or reconnect boundary. The currently applied authoritative sequence is
rendered as `data-testid="multiplayer-sequence"` for acceptance automation.

