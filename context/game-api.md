# Game API

## File Index

This file documents the multiplayer server game object shape.
It explains the fields managed by the server controller.
It is the source of truth for game payload structure returned by the API.

## Content

Date: 2026-03-23
Update: 2026-03-30 21:30:09 UTC - Added spectator-oriented active-game summary fields and documented read-only WebSocket catch-up behavior.

Game Object Shape:
- id: string unique game identifier.
- status: "waiting" | "active" | "over".
- name: string or null (optional game name).
- createdAt: ISO timestamp of creation.
- updatedAt: ISO timestamp of last server-side activity (create/join/move/resign/abandonment).
- players:
  - X: string or null (host name).
  - O: string or null (joiner name).
- state:
  - board: 3x3 array of "X" | "O" | null.
  - currentPlayer: "X" | "O".
  - winner: "X" | "O" | null.
  - isDraw: boolean.
  - endReason: "win" | "draw" | "resign" | "abandonment" | null.
  - moveHistory: array of moves, each move has { row, col, player }.

History Retrieval:
- `GET /games/:id` returns the full game record for replay, including moveHistory.

Game Summary Shape:
- `GET /games?status=...` returns summary objects with:
  - id
  - status
  - name
  - createdAt
  - updatedAt
  - players
  - currentPlayer

Spectator Access:
- `GET /games?status=active` is the server-side discovery endpoint for live games that can be spectated.
- `WS /ws?gameId=...` sends an immediate `game_state` snapshot on connect so late spectators can catch up to the current board and player names.
- Subsequent live updates are delivered as `game_update` and `game_over` messages.
- WebSocket spectators are read-only subscribers and do not consume player slots or change game state by sending messages.

Server Outcomes:
- A win sets state.winner and status "over".
- A draw sets state.isDraw true and status "over".
- Resignation sets the non-resigning player as winner and status "over".
- Automatic abandonment after 3 minutes of inactivity sets the non-active player as winner and status "over".

Join Restrictions:
- The host (player X) is not allowed to join their own game by name.
