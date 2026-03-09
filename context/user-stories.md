# User Stories - Phase 1

Last updated: 2026-03-09

## Epic 1: App Foundation

### US-01 Project Setup
As a developer, I want a React + TypeScript app scaffolded and runnable locally so that I can build and test the game.

Acceptance criteria:
- Project runs locally with a standard dev command.
- TypeScript is configured and compiling without errors.
- Base app shell renders in browser.

### US-02 Navigation Structure
As a player, I want separate landing and gameplay pages so that starting and playing the game feel like distinct flows.

Acceptance criteria:
- Landing route/page is available.
- Gameplay route/page is available.
- Starting a game on landing navigates to gameplay.

## Epic 2: Core Game Logic Module

### US-03 Game Module Data Model
As a developer, I want a dedicated `Game` module so that game state is centralized and predictable.

Acceptance criteria:
- `Game` module exposes types/interfaces for board, move, player, and status.
- `Game` module stores and returns full game state.
- `Game` module stores and returns moves so far with order and placement.
- `Game` module stores and returns current player turn.
- `Game` module stores and returns win status.

### US-04 Move Validation and Turn Progression
As a player, I want only valid moves accepted so that gameplay follows Tic-Tac-Toe rules.

Acceptance criteria:
- Moves can only be placed on empty cells.
- Invalid placements are ignored or rejected safely.
- Player turn alternates after valid moves.
- Move history preserves order of play.

### US-05 Win and Draw Resolution
As a player, I want the game to detect wins and draws correctly so that each game ends with a clear result.

Acceptance criteria:
- All 8 winning line combinations are checked.
- Winner is set immediately when a winning move occurs.
- Draw is set when board is full and no winner exists.
- No additional moves allowed after game over.

## Epic 3: Player Experience

### US-06 Landing Page Experience
As a player, I want a welcoming landing screen with a clear start action so that I can begin quickly.

Acceptance criteria:
- Landing page includes greeting/title and brief intro text.
- Primary call-to-action starts a new game.
- Layout aligns with `context/example-images/landing_page_exmaple.png`.

### US-07 Gameplay Board Rendering
As a player, I want to see a clear 3x3 board and placed marks so that I can understand the current game state.

Acceptance criteria:
- Gameplay page renders 9 interactive cells.
- Cell marks reflect current game state.
- Board updates after each valid move.
- Layout aligns with `context/example-images/gameplay_page_example.png`.

### US-08 Turn and Outcome Feedback
As a player, I want turn and outcome indicators so that I always know whose turn it is and when the game is over.

Acceptance criteria:
- Active player indicator updates as turns change.
- Game-over message shows winner or draw.
- UI clearly distinguishes active play vs finished game.

### US-09 Replay and Exit Controls
As a player, I want to replay or return home after or during a game so that I can continue without refreshing the browser.

Acceptance criteria:
- `Play Again` resets game state and board.
- `Home` returns to landing page.
- Replay returns game to initial turn and empty board.

## Epic 4: Enhanced Gameplay Feedback and CPU Experience

### US-10 Move Audio Feedback
As a player, I want a pleasant "thud" sound when a piece is placed so that moves feel tactile and satisfying.

Acceptance criteria:
- A pleasant "thud" sound plays when a valid move is completed.
- The sound is triggered during normal gameplay for each valid placement.
- The sound is not played for blocked/invalid move attempts.

### US-11 Move Validity Affordances
As a player, I want illegal moves blocked and valid/invalid move states clearly indicated so that I can make confident choices.

Acceptance criteria:
- Illegal moves cannot be made from the UI.
- Valid moves provide clear visual feedback (for example, hover state on available cells).
- Invalid cells provide distinct visual feedback indicating they cannot be selected.

### US-12 Win/Loss Endgame Effects
As a player, I want clear celebratory or corrective audiovisual feedback at game end so that outcomes are immediately understandable.

Acceptance criteria:
- Completing a winning move triggers confetti on the gameplay page.
- Completing a winning move plays a "winning sound".
- Completing a losing move plays a "losing sound".
- When a game is lost, the UI displays written and/or visual feedback telling the player to "try again".

### US-13 Quit Game Control
As a player, I want to quit an in-progress game so that I can leave gameplay intentionally.

Status note (2026-03-01):
- Added a `Quit` label for the secondary gameplay control while a game is in progress.
- Modified post-game behavior so the same control is labeled `Home` after game completion.
- Exiting via `Quit`/`Home` routes back to landing without a browser refresh.

Acceptance criteria:
- A `Quit` control is available during gameplay.
- Activating `Quit` exits the current game flow to the appropriate non-game state.
- Quitting does not require refreshing the browser.

### US-14 Post-Game Rematch Against CPU
As a player, I want a rematch option after finishing a CPU game so that I can immediately play again.

Status note (2026-03-01):
- Skipped as a duplicate of US-09 `Play Again` behavior.

Acceptance criteria:
- After a game against the CPU finishes, a `Rematch` option is available.
- Selecting `Rematch` starts a new game against the CPU.
- Rematch resets board state, status, and turn sequence for a fresh match.

### US-15 Deterministic CPU Opponent
As a developer, I want CPU move selection to be deterministic so that behavior is predictable and testable.

Acceptance criteria:
- Given the same board state and turn context, the CPU always chooses the same move.
- CPU move selection logic is stable across repeated runs in the same app version.

## Epic 5: AWS S3 Static Website Deployment

### US-16 AWS Static Website Infrastructure
As a developer, I want AWS infrastructure for static hosting so that the app can run as an S3 webpage.

Status note (2026-03-06):
- Added infrastructure template: `infra/s3-static-website.yaml`.
- Added setup script: `scripts/aws/setup-s3-website.sh`.
- Added npm command: `npm run aws:s3:setup`.
- Deployed stack `ttt-ms-aj-s3-website` with bucket `ttt-ms-aj-tic-tac-toe-site` in `us-west-2`.
- Configured S3 static website with `index.html` as index and error document for SPA routing.

Acceptance criteria:
- An S3 bucket is created and configured for static website hosting.
- Bucket naming includes `ttt-ms-aj` (for example as a prefix or suffix).
- Public read access is configured safely for website assets.
- Website index and error document behavior is defined for SPA routing.

### US-17 Build and Deploy to S3
As a developer, I want a repeatable deployment process so that the latest app build can be published to the S3 website bucket.

Status note (2026-03-08):
- Added deployment script: `scripts/aws/deploy-s3-website.sh`.
- Added npm command: `npm run aws:s3:deploy`.
- Deployment now builds production assets first, then syncs `dist/` to the S3 website bucket.
- Default target resolution uses stack `ttt-ms-aj-s3-website` to discover bucket `ttt-ms-aj-tic-tac-toe-site` in `us-west-2`, with override support via environment variables or script flags.

Acceptance criteria:
- Production build artifacts are generated before deployment.
- Deployment syncs the build output to the S3 website bucket.
- Deployment target resource names include `ttt-ms-aj`.
- A documented command/script exists for repeatable deployment.

## Epic 6: Quality and Readiness

### US-19 Core Logic Test Coverage
As a developer, I want tests for game logic so that regressions are caught quickly.

Acceptance criteria:
- Tests cover move validation.
- Tests cover turn switching.
- Tests cover win detection for representative lines.
- Tests cover draw detection and post-game move blocking.

# User-stories = Phase 2

Last updated: 2026-03-09

## Sequencing Rule
- Each story must leave production deployable with no broken routes or blocked single-player flow.
- New server-backed capabilities should degrade safely when unfinished, preferably by exposing only the completed multiplayer entry points.
- Infrastructure and client updates should be introduced in the same or earlier story than the feature that depends on them in production.

## Epic 7: Multiplayer Platform Foundation

### US-30 Multiplayer Service Skeleton and Shared Domain
As a developer, I want a backend service scaffold that reuses shared game rules so that multiplayer work starts from a deployable foundation.

Status note (2026-03-09):
- Added `server/index.ts` as a minimal Express service scaffold.
- Added `GET /health` and `GET /ready` endpoints.
- Extracted the `Game` domain implementation to `src/shared/game.ts` and kept frontend imports stable via `src/game/Game.ts` re-exports.
- Added backend local scripts in `package.json` and backend TypeScript config in `tsconfig.server.json`.
- Added IaC placeholder template `infra/multiplayer-service-foundation.yaml` and supporting docs.

Deployable increment:
- Single-player remains unchanged and deployed from S3.
- A separate backend service can be deployed with health visibility and no user-facing multiplayer entry points yet.

Acceptance criteria:
- A backend service exists in the repo and runs locally.
- The service exposes a basic health/readiness endpoint.
- Shared game-domain types or rules needed for server validation are available to both client and server without duplicating Tic-Tac-Toe logic.
- Infrastructure-as-code placeholders or resources for the backend deployment path are added and documented at a foundation level.

### US-31 Create and List Multiplayer Games
As a player, I want to create a multiplayer game and see waiting games so that a second player has something joinable.

Deployable increment:
- The deployed app supports game creation and discovery, even before live play is available.
- Waiting games can be created, listed, and displayed without breaking single-player.

Acceptance criteria:
- `POST /games` creates a new multiplayer game in `waiting` status.
- `GET /games?status=waiting|active|over` returns games filtered by status.
- The server enforces a maximum of 25 concurrent multiplayer games and returns HTTP 429 when the limit is reached.
- The client landing page exposes `Start Multiplayer Game` and `Join Multiplayer Game` entry points.
- The client can create a waiting game and show its game identifier or equivalent join information.

### US-32 Join Game and Start Multiplayer Match
As a player, I want to join an existing waiting game so that two players can start a multiplayer match.

Deployable increment:
- Two players can complete the game setup flow end to end.
- Started games move from waiting state into an active multiplayer game, even if move sync is still HTTP-driven at first.

Acceptance criteria:
- `POST /games/{id}/join` allows one second player to join a waiting game.
- Joining a game changes its status from `waiting` to `active`.
- Once active, additional join attempts are rejected safely.
- The client join flow can select an existing waiting game and enter gameplay as the second player.
- The gameplay UI distinguishes local single-player from multiplayer session state.

## Epic 8: Authoritative Multiplayer Gameplay

### US-33 Server-Validated Multiplayer Moves
As a player, I want multiplayer moves validated by the server so that both clients see the same legal game state.

Deployable increment:
- Multiplayer games are playable end to end using the HTTP API, even if live updates are still basic.
- Server authority exists before websocket fan-out is introduced.

Acceptance criteria:
- `POST /games/{id}/moves` accepts a move suggestion and validates game existence, turn ownership, cell availability, and game-over state.
- Server-side move processing updates authoritative board state, move history, current turn, and win/draw outcome.
- Invalid move requests are rejected with clear non-2xx responses and do not mutate game state.
- The client submits multiplayer moves to the server instead of applying them locally as authoritative state.
- A player can refresh or re-open the game and recover the current authoritative state through the API.

### US-34 Live Multiplayer Updates via Websockets
As a player, I want remote moves to appear automatically so that multiplayer games feel live without manual refresh.

Deployable increment:
- Multiplayer is now real-time for active players.
- If websocket delivery fails, the rest of the deployed application still remains usable.

Acceptance criteria:
- `WS /ws?gameId=...` allows clients to subscribe to multiplayer game events.
- When a valid remote move occurs, subscribed clients receive an event with the updated state or enough data to reconcile state.
- Players in an active multiplayer game see the opponent move without refreshing the page.
- Connection lifecycle states are surfaced clearly enough that users can understand when live sync is unavailable.
- Existing single-player routes and flows remain unaffected.

### US-35 Resign Multiplayer Game
As a player, I want to resign a multiplayer game so that I can end a match I no longer want to continue.

Deployable increment:
- Multiplayer game completion supports an intentional early-exit path without waiting for timeout.

Acceptance criteria:
- `POST /games/{id}/resign` marks the game as over and assigns the other player as winner.
- A resignation event is broadcast to subscribed clients.
- The multiplayer gameplay UI includes a resign control for active games.
- After resignation, no additional moves are accepted for that game.

## Epic 9: Spectating and Replay

### US-36 Spectate Active Games
As a spectator, I want to watch a live multiplayer game so that I can observe play without joining as a player.

Deployable increment:
- The system now supports a third user role without disrupting active player flows.
- Spectators can observe active games in production even before full replay features are added.

Acceptance criteria:
- A spectator can subscribe to a game without being one of the two players.
- Spectators receive the current game state plus subsequent websocket events for live updates.
- Spectators cannot submit moves or other player-only commands successfully.
- The client provides a spectate path for discoverable games.

### US-37 Replay and Catch-Up Data Retention
As a player or spectator, I want enough history stored to catch up to live games and replay completed games so that game progression is understandable after reconnects.

Deployable increment:
- Live games become recoverable after reconnect.
- Completed games can be viewed as replays without affecting active gameplay reliability.

Acceptance criteria:
- Server persists ordered moves or equivalent event history for each multiplayer game.
- Late-joining players and spectators can fetch enough history to reconstruct the current board.
- Completed games retain enough history for replay in the client.
- Replay data access does not allow mutation of historical game state.

## Epic 10: Timeout and Operational Readiness

### US-38 Abandonment Detection and Resolution
As a player, I want abandoned games resolved by the server so that stalled matches do not remain active indefinitely.

Deployable increment:
- Multiplayer operations can close stalled games cleanly in production.
- Timeout handling becomes part of normal live operations without requiring manual admin intervention.

Acceptance criteria:
- The server tracks the timestamp needed to evaluate abandonment for active multiplayer games.
- `POST /games/{id}/abandonment-check` evaluates whether the game has been abandoned based on 3 minutes without the required move.
- When abandonment is confirmed, the game is marked over and the non-abandoning side is declared winner.
- Abandonment decisions are broadcast to subscribed clients.
- Requests made before the timeout threshold do not incorrectly end the game.

### US-39 Phase 2 AWS Deployment and Low-Cost Operations
As a developer, I want Phase 2 infrastructure and deployment automation updated for multiplayer so that the full system can be shipped and operated cheaply on AWS.

Deployable increment:
- The complete Phase 2 system is deployable through documented infrastructure and release steps.
- Frontend and backend can be updated independently without breaking the deployed product.

Acceptance criteria:
- IaC defines the additional backend resources needed for multiplayer deployment.
- Deployment documentation covers both the static frontend and multiplayer backend.
- The deployed architecture stays within the documented low-cost constraint.
- Operational limits and assumptions, including the 25-game concurrency cap, are documented in context.
