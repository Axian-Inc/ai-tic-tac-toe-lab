# Game API

## File Index

This file documents the multiplayer server game object shape.
It explains the fields managed by the server controller.
It is the source of truth for game payload structure returned by the API.

## Content

Date: 2026-03-23

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

Server Outcomes:
- A win sets state.winner and status "over".
- A draw sets state.isDraw true and status "over".
- Resignation sets the non-resigning player as winner and status "over".
- Automatic abandonment after 3 minutes of inactivity sets the non-active player as winner and status "over".

Join Restrictions:
- The host (player X) is not allowed to join their own game by name.
