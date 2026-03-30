# Phase 3 User Stories

## File Index

This file captures detailed user stories for Phase 3 spectator and CI features.
It translates the phase brief and target screenshots into implementable stories.
It includes server, client, testing, coverage, and pipeline outcomes.
It defines acceptance criteria for each story.

## Content

As you implement stories, create tests to cover new or updated logic. For UI, prefer unit tests plus targeted end-to-end coverage for the main spectator flow. For the server, cover active-game listing, spectator subscriptions, and game-state replay/catch-up behavior.

### P3.1: List Active Games for Spectators (Server)
As a spectator, I want to request games that are currently in progress so I can choose one to watch.

Acceptance Criteria:
1. `GET /games?status=active` returns only games currently in progress.
2. Each result includes enough metadata for the client to identify the game and both players when available.
3. Waiting and completed games are excluded from the active-games spectator list.
4. Invalid status values are still rejected with a 400-level response.

### P3.2: Allow Spectators to Join a Live Game Feed (Server)
As a spectator, I want to connect to an existing game without joining as a player so I can watch it in real time.

Acceptance Criteria:
1. A spectator can subscribe to an active game and receive the current game state immediately.
2. After subscribing, the spectator receives future move, state, and game-over updates over WebSocket.
3. A spectator subscription does not consume a player slot or alter turn order.
4. If the target game does not exist, the server returns or emits an error response appropriate to the transport.

### P3.3: Expose Current Game State for Spectator Catch-Up (Server)
As a spectator joining mid-game, I want the latest board state and player information so I can understand the game immediately.

Acceptance Criteria:
1. Spectator entry to a game provides the latest board state, current player, winner/draw state, and move history already stored by the server.
2. The payload includes player display names for X and O when known.
3. A spectator joining after the game has ended can still retrieve the final state for viewing or replay-oriented UI.

### P3.4: Keep Spectator Access Read-Only (Server)
As an operator, I want spectator connections to be read-only so watching a game cannot interfere with gameplay.

Acceptance Criteria:
1. Spectators cannot join a watched game as X or O through the spectate flow.
2. Spectators cannot submit moves, resign on behalf of players, or otherwise mutate the game through spectator-only UI paths.
3. Existing player flows continue to work unchanged for creating, joining, moving, resigning, and receiving updates.

### P3.5: Add a Spectate Entry Point on the Landing Screen (UI)
As a visitor, I want a visible Spectate action on the landing page so I can watch a live game instead of playing.

Acceptance Criteria:
1. The landing page adds a `Spectate` button below `New Multiplayer`.
2. The landing layout and visual hierarchy match `docs/phase-3/target-screenshots/3.Spectate.png`.
3. Existing `Play vs CPU` and `New Multiplayer` actions continue to behave as before.
4. Selecting `Spectate` opens the spectator flow without starting a game.

### P3.6: Show Available Live Games in the Spectate Flow (UI)
As a spectator, I want to see active games to choose from so I can start watching one.

Acceptance Criteria:
1. The spectate flow loads and displays currently active games from the server.
2. Each list item shows enough information to identify the game, including player names when available.
3. The UI includes an empty state when no active games are available.
4. The UI allows the spectator list to be refreshed.

### P3.7: Show Player Names in the Spectator Game View (UI)
As a spectator, I want to see which named player is X or O and whose turn it is so I can follow the match easily.

Acceptance Criteria:
1. The spectator game view uses the multiplayer board layout and adds player names to the X/O status widgets.
2. The current-turn styling continues to indicate which player is active.
3. The layout and status presentation match `docs/phase-3/target-screenshots/3.SpectateGame.png` for spectator viewing.
4. The spectator view remains read-only and updates live as the watched game changes.

### P3.8: Cover Spectator Flows with Automated Tests (Client and Server)
As a developer, I want automated tests for spectator behavior so regressions are caught before release.

Acceptance Criteria:
1. Server tests cover listing active games and allowing spectator subscriptions without consuming player slots.
2. Server tests cover sending current state to a late-joining spectator and broadcasting subsequent updates.
3. Client or end-to-end tests cover entering the spectate flow, listing active games, and viewing a live game.

### P3.9: Generate a Coverage Report from the Terminal (Tooling)
As a developer, I want a terminal command that generates a code coverage report so I can measure automated test coverage locally and in CI.

Acceptance Criteria:
1. The repository exposes a documented terminal command for generating coverage.
2. Running the command produces a machine-readable coverage summary and a human-readable report.
3. The coverage workflow includes the server and client test suites that are part of the project.

### P3.10: Run CI on Pull Requests (Platform)
As a maintainer, I want a GitHub Actions pipeline on pull requests so code quality checks run automatically before merge.

Acceptance Criteria:
1. A GitHub Actions workflow runs on pull requests.
2. The workflow installs dependencies in a clean environment.
3. The workflow runs the project test command(s).
4. The workflow builds or packages the application successfully.
5. The workflow runs the coverage command and publishes coverage artifacts or logs in the workflow output.

### P3.11: Validate Phase 3 Exit Criteria (Project)
As a stakeholder, I want the phase to satisfy its stated exit criteria so the release is complete.

Acceptance Criteria:
1. The web server can report games that are in progress.
2. The client app can list active games and spectate a selected game in real time.
3. The spectator game view shows player names alongside the X/O turn widgets.
4. A terminal coverage command is available and works.
5. A pull-request pipeline compiles or bundles the application, runs tests, and runs coverage.
