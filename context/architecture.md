# Architecture

## File Index

This file summarizes the app's high-level architecture.
It describes the major UI and state-management components.
It records where infrastructure code lives in the repository.
It captures the main data flow between the app shell and the game page.
It also documents the Terraform workspace guard requirement.

## Content

Date: 2026-03-19
Update: 2026-03-30 21:30:09 UTC - Multiplayer server now explicitly supports spectator-oriented active-game discovery and read-only WebSocket catch-up for live game viewing.
Update: 2026-03-30 22:41:06 UTC - Client UI now exposes a dedicated spectator entry flow from the landing page and a read-only spectator board view with player-name status pills.

Overview:
- Single-page React app with landing, single-player game, multiplayer game, and spectator game views.
- Multiplayer server in `/server` provides HTTP API endpoints and WebSocket updates for live play.
- Client multiplayer flow calls the multiplayer HTTP API and subscribes to WebSocket updates during gameplay.
- Spectator clients can discover `active` games over HTTP and subscribe to an existing game's live state over WebSocket without taking a player slot.
- Landing view now contains both multiplayer creation/join entry points and a separate spectator dialog that lists active games.
- Infrastructure now includes a single EC2 instance running the multiplayer server under systemd, alongside the S3 static site.
- Game state managed in App component and passed to GamePage.
- UI components: Board and Square render the grid.
- Infrastructure lives in `/terraform` and provisions AWS S3 static website hosting.
- The Terraform AWS provider inherits region selection from the standard AWS CLI/shared-config resolution chain instead of a Terraform-specific default.
- Deployment scripts in `/scripts` build the app, read Terraform outputs, sync `dist/` to S3, and validate the hosted site.

Data Flow:
- For games played against the computer, the client app owns game state and view routing.
- GamePage handles gameplay events and passes selections back up.
- Multiplayer server maintains in-memory game records and exposes them via HTTP endpoints.
- WebSocket subscribers receive an immediate `game_state` snapshot for catch-up, then `game_update` and `game_over` events as the server state changes.
- Spectator UI first loads active games with `GET /games?status=active`, then fetches the selected game over `GET /games/:id`, then subscribes to `WS /ws?gameId=...` for live updates.
- Terraform must run in the `stanb` workspace; a workspace guard blocks plans in `default`.
