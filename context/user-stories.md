# User Stories - Phase 1

Last updated: 2026-03-25

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
- A unit test runner is configured for local and CI execution of TypeScript game-logic tests.
- Coverage reporting is available for the core game logic module.
- A Playwright UI automation framework is configured to run browser-based smoke tests against the local app.
- Stable automation selectors are available for critical gameplay interactions.

# User-stories = Phase 2

Last updated: 2026-03-30

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

Status note (2026-03-09):
- Added `POST /games` and `GET /games?status=waiting|active|over` to the Express multiplayer service.
- Added in-memory waiting-game storage with a 25 concurrent waiting-or-active game cap and HTTP 429 when full.
- Added landing-page `Start Multiplayer Game` and `Join Multiplayer Game` entry points.
- The client can now create a waiting multiplayer game, display its identifier, and list waiting games from the backend.

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

Status note (2026-03-15):
- Added `POST /games/{id}/join` and `GET /games/{id}` to the Express multiplayer service.
- Extended the multiplayer game record and shared contracts to track explicit player `X`/`O` assignments, join timestamps, and full game snapshots.
- Starting a multiplayer game now enters gameplay as player `X` in a waiting multiplayer session.
- Joining a waiting game from the landing page enters gameplay as player `O` and promotes the game to `active`.
- Multiplayer gameplay now renders session-specific UI, labels the current player role, and supports manual refresh of the authoritative setup state while keeping the board non-authoritative until server move submission is implemented.

Deployable increment:
- Two players can complete the game setup flow end to end.
- Started games move from waiting state into an active multiplayer game, even if move sync is still HTTP-driven at first.

Technical notes:
- Extend the multiplayer game model in `server/index.ts` and `src/shared/multiplayer.ts` to track player slots, joined timestamps, and the state transition from `waiting` to `active`.
  Meaning and objective: This means the backend data shape should explicitly store who occupies player one and player two, when each player joined, and whether the game is still waiting or has started. The goal is to make join decisions and game-status transitions deterministic instead of inferred from incomplete state.
- Add `POST /games/{id}/join` server logic that validates game existence, rejects joins for non-waiting games or full games, assigns the second player, and returns the authoritative game snapshot.
  Meaning and objective: This means the server, not the client, must decide whether a join is valid by checking that the game exists, is still joinable, and has exactly one open player slot. The goal is to prevent duplicate joins, invalid match starts, and client-side assumptions about who successfully entered the game.
- Update the landing-page join flow and gameplay route state so the joining client enters gameplay with multiplayer metadata such as `gameId`, player role, and mode.
  Meaning and objective: This means the client needs to carry multiplayer-specific context into the gameplay screen instead of treating the session like a local game. The goal is to ensure the joined player knows which game to talk to, which side they control, and which UI behavior should apply.
- Update gameplay UI state management to branch between local single-player state and server-backed multiplayer state without regressing existing single-player interactions.
  Meaning and objective: This means gameplay code should have a clear separation between local in-browser game state and state loaded from or synchronized with the server. The goal is to add multiplayer behavior safely while keeping the current single-player path stable and unchanged for existing users.

Acceptance criteria:
- `POST /games/{id}/join` allows one second player to join a waiting game.
- Joining a game changes its status from `waiting` to `active`.
- Once active, additional join attempts are rejected safely.
- The client join flow can select an existing waiting game and enter gameplay as the second player.
- The gameplay UI distinguishes local single-player from multiplayer session state.

## Epic 8: Authoritative Multiplayer Gameplay

### US-33 Server-Validated Multiplayer Moves
As a player, I want multiplayer moves validated by the server so that both clients see the same legal game state.

Status note (2026-03-15):
- Added `POST /games/{id}/moves` to the Express multiplayer service and kept authoritative multiplayer state in the existing in-memory shared `Game` instance per `gameId`.
- Move submission now validates game existence, active status, assigned player role, expected turn, cell availability, and game-over blocking before mutating state.
- Active multiplayer gameplay now submits moves to the server instead of applying them locally and reconciles from the returned authoritative snapshot.
- Multiplayer gameplay route state is now recoverable after browser refresh through URL query session metadata plus `GET /games/{id}` snapshot loading.

Deployable increment:
- Multiplayer games are playable end to end using the HTTP API, even if live updates are still basic.
- Server authority exists before websocket fan-out is introduced.

Technical notes:
- Introduce an authoritative active-game store on the backend that keeps the shared `Game` instance or equivalent serialized multiplayer state per `gameId`.
  Meaning and objective: This means the server must hold the official version of each multiplayer game rather than relying on either browser tab to be correct. The goal is to give every client a single source of truth for board state, turn order, move history, and outcome.
- Add `POST /games/{id}/moves` to validate player role, expected turn, cell availability, and terminal-game constraints using the shared game rules before mutating state.
  Meaning and objective: This means every move request should be checked by the backend to confirm the caller is allowed to act, it is their turn, the target cell is open, and the game is not already over. The goal is to prevent illegal moves and keep both players synchronized on the same valid progression.
- Add a `GET /games/{id}` or equivalent fetch endpoint so the client can recover the current board, move history, status, and assigned side after reload.
  Meaning and objective: This means a client should be able to request the latest game snapshot at any time instead of depending on in-memory browser state. The goal is to support refresh recovery, reconnects, and late entry into an already active session.
- Update the client gameplay flow to submit multiplayer moves to the API, reconcile from the server response, and stop treating local board updates as authoritative in multiplayer mode.
  Meaning and objective: This means the client should stop committing multiplayer moves locally first and instead wait for the server response before updating the displayed state. The goal is to align UI behavior with backend authority and avoid conflicting client-side interpretations of the game.

Acceptance criteria:
- `POST /games/{id}/moves` accepts a move suggestion and validates game existence, turn ownership, cell availability, and game-over state.
- Server-side move processing updates authoritative board state, move history, current turn, and win/draw outcome.
- Invalid move requests are rejected with clear non-2xx responses and do not mutate game state.
- The client submits multiplayer moves to the server instead of applying them locally as authoritative state.
- A player can refresh or re-open the game and recover the current authoritative state through the API.

### US-34 Live Multiplayer Updates via Websockets
As a player, I want remote moves to appear automatically so that multiplayer games feel live without manual refresh.

Status note (2026-03-15):
- Added `WS /ws?gameId=...` websocket subscriptions to the multiplayer backend without changing the existing HTTP create/join/move APIs introduced in earlier stories.
- Added shared websocket event payload types for connection-ready, resync-needed, move-applied, and game-over events.
- Multiplayer gameplay now opens a websocket subscription for the current session, reconciles incoming authoritative snapshots automatically, and surfaces live-sync connection status in the UI.
- `Refresh Match` remains available as the HTTP fallback path when websocket delivery is unavailable or reconnecting.

Deployable increment:
- Multiplayer is now real-time for active players.
- If websocket delivery fails, the rest of the deployed application still remains usable.

Technical notes:
- Add a websocket server alongside Express that manages subscriptions by `gameId` and can broadcast multiplayer events after server-side joins and moves.
  Meaning and objective: This means the backend needs a live push channel where connected clients subscribe to a specific game and receive updates when that game changes. The goal is to remove manual polling and make remote actions appear in near real time.
- Define shared event payload types in `src/shared/multiplayer.ts` for connection-ready, move-applied, game-over, and resync-needed messages so client and server stay aligned.
  Meaning and objective: This means websocket message shapes should be defined once in shared TypeScript types instead of being hand-coded differently on each side. The goal is to reduce integration bugs and make event handling predictable and testable.
- Update multiplayer server handlers to publish websocket events after authoritative state changes while keeping HTTP responses as a fallback path.
  Meaning and objective: This means server endpoints should first apply the official state change and then notify subscribers, while still returning normal HTTP responses to the caller. The goal is to support real-time updates without making websocket delivery a hard dependency for correctness.
- Add client websocket lifecycle handling in the gameplay UI, including reconnect, stale-connection messaging, and HTTP refetch fallback when live sync is unavailable.
  Meaning and objective: This means the client should handle connection open, close, reconnect attempts, and degraded states instead of assuming the socket is always healthy. The goal is to keep multiplayer usable and understandable even when real-time transport is temporarily broken.

Acceptance criteria:
- `WS /ws?gameId=...` allows clients to subscribe to multiplayer game events.
- When a valid remote move occurs, subscribed clients receive an event with the updated state or enough data to reconcile state.
- Players in an active multiplayer game see the opponent move without refreshing the page.
- Connection lifecycle states are surfaced clearly enough that users can understand when live sync is unavailable.
- Existing single-player routes and flows remain unaffected.

### US-35 Resign Multiplayer Game
As a player, I want to resign a multiplayer game so that I can end a match I no longer want to continue.

Status note (2026-03-15):
- Added `POST /games/{id}/resign` to the Express multiplayer service.
- Multiplayer snapshots now include completion metadata so resignation, normal win, and draw outcomes expose a consistent end-state shape through HTTP and websocket updates.
- Multiplayer gameplay now includes a `Resign` control for active games, confirms intent, calls the API, and locks the board once the resignation-completed snapshot is applied.
- Resignation publishes a dedicated websocket event and an updated terminal game snapshot so connected clients and refreshed clients observe the same result.

Deployable increment:
- Multiplayer game completion supports an intentional early-exit path without waiting for timeout.

Technical notes:
- Add resignation state handling to the shared multiplayer model so completed games record end reason, winner, loser, and completion timestamp.
  Meaning and objective: This means the multiplayer data model should treat resignation as a first-class game-ending outcome with explicit fields describing what happened. The goal is to preserve accurate game history and allow the UI to explain why the match ended.
- Implement `POST /games/{id}/resign` with checks for active game status, valid player role, and idempotent rejection once the game is already over.
  Meaning and objective: This means only an active player in an active game should be able to resign, and repeated or late resign requests should not alter finished state. The goal is to make resignation safe, predictable, and resistant to duplicate submissions.
- Publish a resignation event through the websocket channel and update any HTTP game-detail response to expose the resignation outcome consistently.
  Meaning and objective: This means all connected clients and future fetches should report the same resignation result using both live and pull-based channels. The goal is to keep the game-ending state consistent for the resigning player, the opponent, and any spectators.
- Add a multiplayer-only resign control in gameplay UI that confirms intent, calls the API, and transitions the board into a locked completed state.
  Meaning and objective: This means the interface should provide a deliberate action for multiplayer resignation and then stop further board interaction once the action succeeds. The goal is to give players a clear exit path while preventing accidental continued play after the match is over.

Acceptance criteria:
- `POST /games/{id}/resign` marks the game as over and assigns the other player as winner.
- A resignation event is broadcast to subscribed clients.
- The multiplayer gameplay UI includes a resign control for active games.
- After resignation, no additional moves are accepted for that game.

## Epic 9: Spectating and Replay

### US-36 Spectate Active Games
As a spectator, I want to watch a live multiplayer game so that I can observe play without joining as a player.

Status note (2026-03-15):
- Added a spectator multiplayer session role in the shared client contracts so gameplay can distinguish player-controlled sessions from read-only observers without consuming player slots.
- Landing page multiplayer discovery now includes a `Spectate Live Game` path backed by existing `GET /games?status=active` and `GET /games/{id}` responses rather than adding a duplicate discovery or hydration endpoint.
- Gameplay now supports spectator mode in the existing multiplayer route, rendering the authoritative board as read-only while still subscribing to the existing websocket live-update stream.
- Player-only actions remain restricted to player sessions in the client, so spectators can observe current state and websocket updates but cannot submit moves or resign through the UI.

Deployable increment:
- The system now supports a third user role without disrupting active player flows.
- Spectators can observe active games in production even before full replay features are added.

Technical notes:
- Extend the game access model to support a `spectator` session role that can subscribe and fetch state without occupying a player slot.
  Meaning and objective: This means the system should distinguish between people who are playing and people who are only observing, with observers not consuming one of the two player positions. The goal is to enable spectating without interfering with normal match setup.
- Expose discoverable active-game data to the client through lobby listing or game-detail responses so spectators have a stable entry path.
  Meaning and objective: This means the frontend needs a defined way to find games that are available to watch instead of requiring hidden or manual IDs. The goal is to make spectating a supported user flow rather than an implementation accident.
- Allow websocket subscriptions and initial state hydration for non-player clients while keeping move, join, and resign endpoints restricted to player roles only.
  Meaning and objective: This means spectators should be able to read game state and receive updates, but any action that changes the game must still require a player role. The goal is to preserve watch access without weakening gameplay authority or permissions.
- Add a spectate route or gameplay mode in the client that renders the board as read-only and surfaces that the viewer is observing rather than participating.
  Meaning and objective: This means the UI should visually communicate that the current user is not allowed to make moves and should disable interaction accordingly. The goal is to avoid confusion between playing and watching while reusing as much gameplay presentation as possible.

Acceptance criteria:
- A spectator can subscribe to a game without being one of the two players.
- Spectators receive the current game state plus subsequent websocket events for live updates.
- Spectators cannot submit moves or other player-only commands successfully.
- The client provides a spectate path for discoverable games.

### US-37 Replay and Catch-Up Data Retention
As a player or spectator, I want enough history stored to catch up to live games and replay completed games so that game progression is understandable after reconnects.

Status note (2026-03-16):
- Multiplayer game snapshots now retain ordered lifecycle events for create/join/complete milestones alongside the existing ordered move history in `state.moves`.
- The gameplay screen now includes replay/catch-up controls that derive intermediate board states from retained move history without mutating the live authoritative snapshot.
- Phase 2 retention is explicitly documented as in-memory only for the current single-process deployment, so replay/catch-up history survives reconnects but not backend restarts.

Deployable increment:
- Live games become recoverable after reconnect.
- Completed games can be viewed as replays without affecting active gameplay reliability.

Technical notes:
- Persist ordered move history and key game events as part of each multiplayer game record instead of relying only on current board state.
  Meaning and objective: This means the backend should keep the sequence of what happened, not just the latest board snapshot. The goal is to support reconnect recovery, replay features, and debugging of how a game reached its current state.
- Ensure game-detail responses include enough data to rebuild the board from history, including move order, player side, terminal status, and end reason.
  Meaning and objective: This means API responses should provide all fields needed for a client to reconstruct state deterministically from stored history. The goal is to allow replay and catch-up logic to work without hidden backend-only assumptions.
- Add client replay/catch-up logic that can derive intermediate board states from stored history without mutating authoritative live state.
  Meaning and objective: This means the frontend should be able to step through recorded moves for viewing purposes while keeping the real server-owned game state untouched. The goal is to support replay and historical inspection without introducing side effects into live matches.
- Decide and document whether Phase 2 retention remains in-memory for a single-process deployment or moves to a low-cost persisted store as part of deployment work.
  Meaning and objective: This means the team must make an explicit storage decision for how long move history survives process restarts and deployments. The goal is to avoid ambiguous reliability expectations and ensure the replay feature matches the chosen operational model.

Acceptance criteria:
- Server persists ordered moves or equivalent event history for each multiplayer game.
- Late-joining players and spectators can fetch enough history to reconstruct the current board.
- Completed games retain enough history for replay in the client.
- Replay data access does not allow mutation of historical game state.

## Epic 10: Multiplayer Access Modal

### US-38 Launch Multiplayer Modal from Landing
As a player, I want multiplayer setup to open in a modal from the landing page so that I can create, join, or spectate without leaving the main screen context.

Status note (2026-03-16):
- Replaced the separate landing-page multiplayer buttons with one `New Multiplayer` CTA.
- Added a centered multiplayer modal that can be closed by close button, cancel action, escape key, or backdrop click without leaving the landing page.
- Moved the existing create, join, and spectate entry behaviors into the modal while adding one shared player-name input for the multiplayer setup surface.

Deployable increment:
- The landing page exposes multiplayer through a single `New Multiplayer` entry point instead of separate create/join links.
- Multiplayer setup becomes a contained overlay flow that preserves the existing landing-page presentation and CPU entry path.

Technical notes:
- Replace separate landing-page multiplayer entry points with a single `New Multiplayer` action that opens a centered modal matching `context/example-images/phase2/landing page.png` and `context/example-images/phase2/Create multiplayer modal.png`.
  Meaning and objective: This means the landing page should keep one clear multiplayer call to action and defer the rest of the setup choices into an overlay. The goal is to simplify the first interaction and align the UI structure with the Phase 2 visual reference.
- Add modal open, close, and escape/cancel behavior that does not disrupt the existing single-player landing-page flow.
  Meaning and objective: This means users should be able to enter and dismiss multiplayer setup without navigating away or breaking the CPU play path. The goal is to keep the modal lightweight and reversible.
- Keep player-name capture inside the modal so create, join, and spectate actions can reuse a single multiplayer setup surface.
  Meaning and objective: This means participant identity input should live in one shared modal form instead of being duplicated across separate routes or panels. The goal is to make multiplayer setup consistent across all multiplayer entry actions.

Acceptance criteria:
- Landing page exposes a single multiplayer CTA that opens a modal.
- The modal can be closed without leaving the landing page.
- Opening and closing the modal does not break the existing single-player CTA.
- The modal includes shared player-name input for multiplayer flows.

### US-39 Create Multiplayer Game from Modal
As a player, I want to create a multiplayer game from the modal so that I can host a match without leaving the landing page flow.

Status note (2026-03-16):
- Added a dedicated create tab state inside the existing multiplayer modal with required player-name and game-name inputs.
- Wired create submission to the existing `POST /games` flow so successful creation still opens gameplay as host player `X` in a waiting session.
- Added shared frontend/backend validation and in-modal error messaging for missing or oversized create fields.

Deployable increment:
- Hosting a new multiplayer session is initiated from the create tab inside the modal.
- The created game flow stays aligned with the existing backend create endpoint while adopting the new modal-first UX.

Technical notes:
- Add a `Create` mode in the multiplayer modal, matching `context/example-images/phase2/Create multiplayer modal.png`, with fields for player name and game name.
  Meaning and objective: This means the modal should provide a dedicated create state where the host can identify themselves and label the game before submitting. The goal is to support intentional match creation with the UI shown in the reference image.
- Wire modal create submission to the existing multiplayer create flow so successful creation still provisions a waiting game and navigates the host into the multiplayer session as player `X`.
  Meaning and objective: This means the create modal should change the frontend entry experience, not replace the underlying multiplayer session setup rules. The goal is to preserve the current server-backed behavior while modernizing the entry UI.
- Surface create-state validation and request failure messaging inside the modal without regressing the deployable waiting-game path introduced earlier.
  Meaning and objective: This means missing required fields or backend failures should be explained within the modal instead of dropping the user into a broken state. The goal is to keep creation reliable and understandable.

Acceptance criteria:
- The multiplayer modal includes a create mode with player-name and game-name inputs.
- Submitting create from the modal calls the existing create-game flow successfully.
- A successful create action starts a waiting multiplayer game for the host.
- Validation or backend failures are shown in the modal without breaking the landing page.

### US-40 Join or Spectate Multiplayer Games from Modal
As a player or spectator, I want to discover available games in the multiplayer modal so that I can join a waiting match or spectate an active one from the same setup surface.

Status note (2026-03-16):
- Consolidated modal discovery into a single `Join` mode that loads waiting and active games together.
- Grouped waiting games as joinable entries and active games as spectator entries inside the same modal panel.
- Added shared refresh and explicit no-games messaging without changing the underlying join or spectate backend flows.

Deployable increment:
- Multiplayer join and spectate discovery are consolidated into the modal instead of spread across separate landing-page actions.
- Empty-state and refresh behavior become part of the supported multiplayer discovery UX.

Technical notes:
- Add a `Join` mode in the multiplayer modal, matching `context/example-images/phase2/Create mulitplayer modal - no games.png`, that lists available games and handles explicit empty-state messaging plus refresh.
  Meaning and objective: This means the modal should provide a browseable multiplayer list instead of requiring a separate landing-page panel or navigation step. The goal is to centralize multiplayer discovery and support the no-games state shown in the reference image.
- Update discovery data and UI grouping so waiting games are clearly joinable and active games are clearly spectatable from the same modal list.
  Meaning and objective: This means the client should distinguish between games a user can join as player `O` and games they can only watch as a spectator. The goal is to support both capabilities from one modal without confusing the available actions.
- Reuse the existing waiting-game join flow and active-game spectate flow from the modal so the chosen list action enters gameplay with the correct session role and authoritative game context.
  Meaning and objective: This means modal actions should still land users in the correct multiplayer mode, whether they are joining as a player or entering as a spectator. The goal is to keep backend behavior unchanged while updating how users initiate those flows.

Acceptance criteria:
- The multiplayer modal includes a join/discovery mode for available games.
- Waiting games in the modal can be joined as player `O`.
- Active games in the modal can be entered in spectator mode.
- When no games are available, the modal shows an explicit empty state.
- The modal supports refreshing the available-game list.

## Epic 11: Timeout and Operational Readiness

### US-41 Abandonment Detection and Resolution
As a player, I want abandoned games resolved by the server so that stalled matches do not remain active indefinitely.

Deployable increment:
- Multiplayer operations can close stalled games cleanly in production.
- Timeout handling becomes part of normal live operations without requiring manual admin intervention.

Technical notes:
- Track per-game activity timestamps on the backend, updating the relevant fields after joins, valid moves, and reconnect-driven state fetches only where appropriate.
  Meaning and objective: This means the server should record when the game last progressed and, if needed, when the currently expected player last had a chance to act. The goal is to give abandonment checks a reliable time basis instead of guessing from incomplete events.
- Implement `POST /games/{id}/abandonment-check` to compare current time against the expected-turn inactivity window and reject premature checks safely.
  Meaning and objective: This means a client can ask the server to evaluate timeout status, but the server must only end the game when the full three-minute threshold has actually passed. The goal is to automate stalled-game resolution without creating false positives.
- Record abandonment as a distinct game-over reason and determine the winner from the player who was not overdue for the required move.
  Meaning and objective: This means abandonment should be stored differently from win, draw, or resignation, with the remaining responsive player marked as the winner. The goal is to preserve accurate outcome semantics for UI messaging, history, and later analysis.
- Broadcast abandonment outcomes over websocket and surface countdown or stale-game messaging in the client so players understand why the game ended.
  Meaning and objective: This means timeout results should be pushed to connected clients immediately, and the interface should explain the reason for the closure. The goal is to reduce confusion when a game ends without a normal final move.

Acceptance criteria:
- The server tracks the timestamp needed to evaluate abandonment for active multiplayer games.
- `POST /games/{id}/abandonment-check` evaluates whether the game has been abandoned based on 3 minutes without the required move.
- When abandonment is confirmed, the game is marked over and the non-abandoning side is declared winner.
- Abandonment decisions are broadcast to subscribed clients.
- Requests made before the timeout threshold do not incorrectly end the game.

### US-42 Phase 2 AWS Deployment and Low-Cost Operations
As a developer, I want Phase 2 infrastructure and deployment automation updated for multiplayer so that the full system can be shipped and operated cheaply on AWS.

Deployable increment:
- The complete Phase 2 system is deployable through documented infrastructure and release steps.
- Frontend and backend can be updated independently without breaking the deployed product.

Technical notes:
- Expand `infra/multiplayer-service-foundation.yaml` into deployable backend infrastructure that exposes both HTTP API and websocket connectivity while preserving the existing S3 frontend path.
  Meaning and objective: This means the placeholder infrastructure template should become a real deployment definition for the multiplayer service, including network access for REST and websocket traffic. The goal is to make the backend shippable without changing the established static frontend hosting model.
- Add deployment scripting and environment configuration for backend build, release, and client API/websocket endpoint injection so frontend and backend remain independently deployable.
  Meaning and objective: This means deployment automation should cover building and releasing the backend and passing its public endpoint information into the frontend configuration. The goal is to let each side be updated on its own cadence without manual, error-prone setup steps.
- Document operational assumptions in context, including concurrency limits, in-memory versus persistent storage decisions, health checks, and rollback expectations.
  Meaning and objective: This means the context docs should state the system limits and operating model explicitly rather than leaving them implied in code or scripts. The goal is to make deployment, support, and future implementation decisions consistent with the intended constraints.
- Keep AWS choices constrained to low-cost managed services or a single lightweight backend runtime that can support the Phase 2 25-game cap without introducing unnecessary infrastructure.
  Meaning and objective: This means infrastructure selection should stay intentionally small and cheap, only adding services that are required to meet the documented multiplayer scope. The goal is to satisfy Phase 2 functionality while preserving the project’s low-cost deployment requirement.

Acceptance criteria:
- IaC defines the additional backend resources needed for multiplayer deployment.
- Deployment documentation covers both the static frontend and multiplayer backend.
- The deployed architecture stays within the documented low-cost constraint.
- Operational limits and assumptions, including the 25-game concurrency cap, are documented in context.


## Phase 3 User Stories

### US-43 Pull Request CI Pipeline
As a developer, I want a GitHub Actions pipeline that runs on pull requests so that regressions are caught before merge.

Status note (2026-03-26):
- Added GitHub Actions workflow: `.github/workflows/pr.yml`.
- Workflow triggers on `pull_request`, installs dependencies with `npm ci`, runs `npm test`, and runs `npm run build`.
- CI reuses existing repo-root npm commands and remains validation-only with no deployment or artifact-publish steps.

Technical notes:
- Add a GitHub Actions workflow under `.github/workflows/` that runs on pull request events.
  Meaning and objective: This means CI should be defined in-repo using the standard GitHub Actions workflow location and triggered automatically when pull requests are opened or updated. The goal is to make validation part of the normal review path instead of a manual step.
- Configure the workflow to check out the repo, install Node dependencies, and use the project’s existing npm commands rather than bespoke shell logic.
  Meaning and objective: This means the workflow should run the same supported commands developers use locally instead of duplicating behavior in custom CI-only scripts. The goal is to reduce maintenance cost and keep local and CI execution paths consistent.
- Run the automated unit-test command as one validation step and the application build or packaging command as a separate validation step.
  Meaning and objective: This means CI should validate both correctness and buildability, with tests and packaging represented as distinct stages that can fail independently. The goal is to catch both logic regressions and broken builds before merge.
- Keep the workflow scoped to validation only so it does not deploy infrastructure or publish artifacts during pull request runs.
  Meaning and objective: This means the pull-request pipeline should stop at verification and avoid mutating shared environments or creating releases. The goal is to keep PR checks safe, fast, and focused on merge readiness.

Acceptance criteria:
- At least one workflow file exists under `.github/workflows/`.
- The workflow is configured to trigger on pull request events targeting the repository.
- On each pull request run, the workflow installs dependencies and executes the project's automated unit-test command.
- On each pull request run, the workflow executes the project's build or packaging command and fails the run if that command fails.

### US-44 Spectate Entry from the UI
As a spectator, I want a `Spectate` entry point in the UI so that I can discover active games to watch.

Status note (2026-03-30):
- Added a dedicated landing-page `Spectate` control in `src/App.tsx`.
- The spectate entry opens a spectate-specific discovery view that loads only `active` multiplayer games via the existing list endpoint.
- Selecting a listed active game reuses the existing spectator session path into read-only multiplayer gameplay.

Technical notes:
- Add a dedicated `Spectate` trigger to the landing-page multiplayer entry UI instead of requiring manual game-ID navigation.
  Meaning and objective: This means the landing page should expose a first-class spectator path rather than assuming users already know a target game identifier. The goal is to make spectating discoverable and reduce friction for users who only want to watch active games.
- Reuse the existing multiplayer discovery fetch path to request `active` games from the backend and store those results in landing-page UI state.
  Meaning and objective: This means the client should build on the current multiplayer listing flow and narrow it to active games instead of introducing a second discovery system. The goal is to keep the implementation small and ensure the spectator list stays aligned with the backend’s authoritative game statuses.
- Render active-game discovery results with a spectator-specific action that routes into gameplay using spectator session metadata.
  Meaning and objective: This means each active game entry should provide a watch action that navigates into gameplay with enough route state to identify the user as a spectator. The goal is to reuse the gameplay screen safely while preventing the client from treating the spectator like a player.
- Keep the new spectate entry flow isolated from existing create/join behaviors so single-player and player multiplayer paths do not regress.
  Meaning and objective: This means the new UI state and handlers should be added without rewriting the already-working single-player, create-game, or join-game flows. The goal is to reduce regression risk while adding a third entry path.

Acceptance criteria:
- The landing page renders a visible `Spectate` control without requiring a game ID to be typed manually.
- Activating `Spectate` requests and displays multiplayer games whose server status is `active`.
- Waiting games and completed games are not shown in the active-games spectate list.
- Selecting a listed active game navigates the user into a spectator gameplay view for that game.

### US-45 Terminal Code Coverage Reporting
As a developer, I want a code coverage report that runs from the terminal so that I can measure automated test coverage locally and in CI.

Status note (2026-03-30):
- Moved the repo-root `npm test` coverage workflow to the Playwright unit-test suite under `tests/unit`.
- Confirmed the Playwright coverage wrapper prints terminal coverage and writes artifacts to the stable `coverage/` directory.
- Migrated the former Vitest game and AWS helper suites into Playwright-managed tests under `tests/unit`, and replaced the spectate jsdom test with a Playwright browser spec under `tests/e2e`.
- Updated pull-request CI and project docs to use the same `npm test` coverage workflow alongside the existing build validation step.

Technical notes:
- Add or confirm a repo-root npm command that runs the existing unit-test stack with coverage enabled.
  Meaning and objective: This means developers and CI should be able to use one standard command from the repository root to produce coverage instead of needing manual flags or local knowledge. The goal is to make coverage generation easy to run and easy to document.
- Configure coverage output so it is both printed in the terminal and written to a stable artifact directory for later inspection or CI upload.
  Meaning and objective: This means the coverage workflow should produce immediate console feedback plus files on disk that can be inspected locally or attached to CI runs. The goal is to support both developer use and automated pipeline consumption from the same command.
- Keep coverage scope aligned with the project’s documented unit-test targets rather than introducing a new test runner or duplicate coverage path.
  Meaning and objective: This means coverage should be generated through the current unit-test tooling and source-file scope already documented in project context. The goal is to avoid fragmenting the test strategy or producing conflicting coverage reports.
- Document the command in project docs or context so local developers and CI can invoke the same coverage workflow.
  Meaning and objective: This means the chosen coverage command should be written down in the repo’s living documentation instead of existing only in package scripts. The goal is to keep local development and CI aligned on one supported way to generate coverage.

Acceptance criteria:
- A repository command runnable from the repo root generates a coverage report from automated tests.
- Running the command produces coverage output in the terminal and writes a coverage artifact directory to disk.
- The coverage report includes the project's Playwright unit-test coverage for the configured source files.
- The command exits with a non-zero status when tests fail or coverage generation cannot complete.
