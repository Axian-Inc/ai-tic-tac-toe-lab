# Phase 2 User Stories

## File Index

This file captures detailed user stories for Phase 2 multiplayer features.
It translates the scraped requirements into implementable stories.
It includes server, client, infrastructure, and testing outcomes.
It defines acceptance criteria for each story.

## Content

As you implement stories, create tests to cover new or updated logic.  For UI, unit tests and some e2e tests.
For the server, unit and stateful flow tests.

### P2.1: Create a Multiplayer Game (Server)
As a player, I want to create a new multiplayer game so another player can join and we can start playing.

Acceptance Criteria:
1. `POST /games` creates a new game in `waiting` status.
2. The response includes a unique `gameId` and initial game state.
3. The game is available in `GET /games?status=waiting` results.
4. No authentication is required to create a game.

### P2.2: List Games by Status (Server)
As a player, I want to see waiting, active, or over games so I can decide which game to join or watch.

Acceptance Criteria:
1. `GET /games?status=waiting|active|over` returns games filtered by the requested status.
2. The response includes enough metadata to identify each game and its status.
3. Invalid status values are rejected with a 400-level response.

### P2.3: Join a Waiting Game (Server)
As a player, I want to join a waiting game so the match becomes active and other players cannot join it.

Acceptance Criteria:
1. `POST /games/{id}/join` transitions the game from `waiting` to `active`.
2. After a game is `active`, additional join attempts are rejected.
3. The response includes the updated game state and player assignment.
4. No authentication is required to join a game.

### P2.4: Make a Move with Validation (Server)
As a player, I want to propose a move and have the server validate it so only legal moves are applied.

Acceptance Criteria:
1. `POST /games/{id}/moves` accepts a proposed move from a player.  The request body specifies the player ID 
   and the position.
2. The server validates the move against current game state and turn order.
3. Invalid moves are rejected with a 400-level response and do not change state.
4. Valid moves update the game state and are broadcast to listeners.

### P2.5: Receive Multiplayer Updates via WebSocket (Server)
As a player or spectator, I want to receive live game updates so I can see remote moves and outcomes in real time.

Acceptance Criteria:
1. `WS /ws?gameId=...` allows clients to subscribe to game events.
2. When a valid move is applied, the server broadcasts the move and updated state.
3. When a game ends, the server broadcasts the final outcome.
4. Subscribers can catch up to the current game state on connect.

### P2.6: Spectate a Game (Server)
As a spectator, I want to watch a game without being a player so I can follow play in real time.

Acceptance Criteria:
1. Spectators can subscribe via the WebSocket without joining as players.
2. Spectators receive the same move and outcome updates as players.
3. Spectators do not affect game state or turn order.

### P2.7: Resign a Game (Server)
As a player, I want to resign so the other player is declared the winner and the game ends cleanly.

Acceptance Criteria:
1. `POST /games/{id}/resign` ends the game immediately.
2. The server declares the other player the winner.
3. The resignation result is broadcast to listeners.
4. A resigned game is marked `over` and no further moves are accepted.

### P2.8: Abandonment Detection (Server)
As a player, I want abandoned games to end so matches do not stay stuck indefinitely.

Acceptance Criteria:
1. If a player has not moved for 3 minutes, the game can be marked `over`.
2. `POST /games/{id}/abandonment-check` triggers a server decision on abandonment.
3. Either player can request the abandonment check.
4. When abandonment is confirmed, the server declares a winner and broadcasts the outcome.

### P2.9: Enforce Game Capacity (Server)
As an operator, I want to limit concurrent multiplayer games to protect the service.

Acceptance Criteria:
1. The server allows up to 25 concurrent multiplayer games.
2. When the limit is reached, new game creation returns HTTP 429.
3. The limit applies to active and waiting games.

### P2.10: Persist Game History for Replay (Server)
As a player, I want game state and move history preserved so I can replay or catch up to a live game.

Acceptance Criteria:
1. The server stores enough data to reconstruct a game from start to finish.
2. New WebSocket subscribers can receive a full current state on connect.
3. Historical game data can be retrieved to replay completed games.

### P2.11: Single Player Mode Remains Intact (Client)
As a player, I want single-player gameplay to keep working as in Phase 1 so I can still play locally against the AI.

Acceptance Criteria:
1. Single-player mode behavior matches Phase 1 requirements.
2. Existing Playwright tests for single-player flow still pass.
3. Multiplayer changes do not alter single-player game logic.

### P2.12: Landing Page Multiplayer Entry (UI)
As a player, I want a clear multiplayer entry point on the landing page so I can start a multiplayer session.

Acceptance Criteria:
1. The landing screen matches the multiplayer call-to-action layout and styling in `docs/phase-2/target-screenshots/2.LandingMultiplayer.png`.
2. The landing page includes a primary `Play vs CPU` action and a secondary `New Multiplayer` action.
3. Selecting `New Multiplayer` opens the multiplayer modal without leaving the landing screen.

### P2.13: Multiplayer Modal - Create Flow (UI)
As a player, I want a modal that lets me create a multiplayer game with my name and a game name.

Acceptance Criteria:
1. The modal layout, controls, and visual styling match `docs/phase-2/target-screenshots/2.MultiplayerNew.png`.
2. The modal includes a `Your Name` input and a `Game Name` input, both required to enable `Create Game`.
3. The modal includes a close control that returns me to the landing page without starting a game.
4. The `Create` tab is visually active by default when opening the modal from the landing page.

### P2.14: Multiplayer Modal - Join Flow (UI)
As a player, I want a modal that lets me view and join available games.

Acceptance Criteria:
1. The modal layout, controls, and visual styling match `docs/phase-2/target-screenshots/2.MultiplayerJoin.png`.
2. The modal includes a `Your Name` input and a `Join` tab that switches the content area to available games.
3. The available games area includes an empty state message when no games are listed.
4. A refresh control is present to reload the available games list.

### P2.15: Multiplayer Tests (Client and Server)
As a developer, I want automated tests that cover multiplayer behavior so regressions are caught early.

Acceptance Criteria:
1. Server tests cover game creation limits and abandonment behavior.
2. Server tests cover move validation and win/lose outcomes.
3. Client or end-to-end tests cover creating, joining, and playing a multiplayer game.

### P2.16: Infrastructure Updates (Platform)
As an operator, I want the infrastructure updated for the multiplayer server so it can be deployed reliably at low cost.

Acceptance Criteria:
1. IaC captures the new server resources needed for HTTP and WebSocket traffic.
2. Deployment targets AWS and uses low-cost options.
3. The multiplayer server can be deployed alongside the existing static client.

### P2.17: Exit Criteria Validation (Project)
As a stakeholder, I want the phase to meet all exit criteria so the release is complete.

Acceptance Criteria:
1. Single-player and multiplayer features are both available in the app.
2. Users can create and join multiplayer games.
3. Multiplayer updates are received asynchronously over WebSockets.
4. Up to 25 concurrent games are supported with proper capacity handling.
5. Game state and move history are preserved for replay or catch-up.
6. Multiplayer tests pass and existing single-player tests remain green.
7. IaC changes are deployed and validated in AWS.
