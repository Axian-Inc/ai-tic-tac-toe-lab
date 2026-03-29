# Frontend/Backend Integration

This document maps how the frontend talks to the multiplayer backend and how live game state is maintained in the browser.

## Main Frontend Integration Files

- `src/multiplayer/api.ts`
  HTTP client functions for multiplayer endpoints
- `src/multiplayer/storage.ts`
  Browser-side participant session storage
- `src/multiplayer/types.ts`
  Frontend multiplayer request and response shapes
- `src/hooks/useMultiplayerGame.ts`
  Main orchestration for fetch, join, move submission, replay, and live updates
- `src/routes/LandingPage.tsx`
  Create, join, and spectate entry points
- `src/routes/GamePage.tsx`
  CPU and multiplayer game pages

## Entry Flows

Create flow:

1. The landing page calls the create-game API.
2. The response returns player `X` capability data.
3. The frontend stores that participant session locally.
4. The browser navigates to `/game/:id`.

Join flow:

1. The landing page lists `waiting` games.
2. The user joins a selected game.
3. The response returns player `O` capability data.
4. The frontend stores that participant session locally.
5. The browser navigates to `/game/:id`.

Spectate flow:

1. The landing page lists `active` and `over` games for spectating.
2. The browser navigates to `/game/:id`.
3. The frontend reads game state with `GET /games/{id}`.
4. The frontend can connect to WebSocket updates without a player session.

## Participant Identity

The backend uses game-scoped capability ids rather than accounts.

The frontend persists:

- `playerId`
- `mark`

These values are stored per game and reused for:

- move submission
- resignation
- abandonment checks
- player-specific UI labels

## State Hydration And Replay

Multiplayer pages bootstrap from `GET /games/{id}`.

That response provides:

- the latest game snapshot
- ordered event history
- player join state

The frontend uses that data to:

- render the current board
- replay historical moves when opening active or finished games
- preserve player identity while replay runs
- return to live mode after catch-up completes

Replay does not depend on the WebSocket connection. WebSockets are only used for live event delivery after hydration.

## Live Updates

After the initial game load, the frontend subscribes to the WebSocket API for the current game.

The WebSocket connect request includes:

- `gameId`
- `participantType`
- `participantId`

Incoming messages contain:

- event `type`
- `gameId`
- `sequenceNumber`
- `createdAt`
- event `data`

The frontend applies those updates to local multiplayer state and may queue or defer them while replay is active.

## HTTP Surface Used By The Frontend

The frontend depends on these backend routes:

- `POST /games`
- `GET /games/{id}`
- `GET /games?status=waiting|active|over`
- `POST /games/{id}/join`
- `POST /games/{id}/moves`
- `POST /games/{id}/resign`
- `POST /games/{id}/spectate`
- `POST /games/{id}/abandonment-check`

For the exact current request and response shapes, see [../context/api-implementation.md](../context/api-implementation.md).

## Environment Variables

The frontend build reads:

- `VITE_MULTIPLAYER_API_BASE_URL`
- `VITE_MULTIPLAYER_WS_URL`

These are injected during deployment from Terraform outputs.

## Failure Handling

The frontend surfaces backend API errors to the user for common cases such as:

- invalid join attempts
- illegal moves
- stale game state
- game capacity reached

The user can also manually refresh the multiplayer game page state through the in-game action bar.
