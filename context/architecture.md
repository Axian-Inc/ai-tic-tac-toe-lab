# Architecture

Last updated: 2026-04-08

## Phase 1

## Test Automation Foundation
- Unit test execution is handled by Vitest using the Vite config, with `jsdom` enabled so logic tests and future React rendering tests share one runner.
- Browser automation is handled by Playwright against the local Vite app using a dedicated `playwright.config.ts`.
- Playwright discovery now includes both browser specs in `tests/e2e/` and isolated runner-based specs in `tests/unit/`.
- Browser specs now share a Playwright fixture layer under `tests/e2e/fixtures/` that constructs page objects instead of repeating raw locators inside specs.
- The browser automation support layer now includes:
  - `tests/e2e/page-objects/` for `LandingPage`, `GameplayPage`, and `MultiplayerModalPage`
  - `tests/e2e/support/step-async.ts` for manual-step-aligned execution and failure attachments
  - `tests/e2e/support/TestSupportApi.ts` for backend reset, seed, capacity, and forced-failure automation hooks
  - `tests/playwright/runtime.ts` for frontend-only versus frontend-plus-backend startup selection
- Playwright reporting now keeps console `list` output while also writing JUnit XML to `test-results/playwright/junit.xml`.
- Coordinated multiplayer automation startup uses an automation-only backend command (`npm run server:start:automation`) with `AUTOMATION_TEST_SUPPORT=1` so Playwright can run against the existing backend source plus guarded test-support endpoints.
- Full-mode Playwright browser runs use one worker until isolated backend instances exist because multiplayer automation shares one in-memory backend process.
- Automation-stable selectors are exposed through `data-testid` attributes on landing/gameplay controls, board container, status text, board cells, multiplayer modal/discovery surfaces, gameplay session metadata, replay controls, timeout controls, and resignation confirmation UI.
- Initial framework coverage includes:
  - `src/game/Game.test.ts` for core logic regression checks.
  - `tests/e2e/gameplay.spec.ts` for landing-to-gameplay smoke coverage.
  - `tests/unit/cpu.spec.ts` for deterministic CPU move-selection coverage through the Playwright runner.

### Game State Module
- Added `src/game/Game.ts` as the centralized state container for core Tic-Tac-Toe data.
- `Game` module exports shared domain types: `Player`, `Board`, `Move`, `GameStatus`, and `GameState`.
- `Game` class owns in-memory game state and exposes read APIs: `getState()`, `getBoard()`, `getMoves()`, `getCurrentPlayer()`, and `getStatus()`.
- Read methods return copies to keep internal state predictable and prevent external mutation.
- Added move APIs for gameplay progression:
  - `canPlaceMove(position)` validates board index, game-over state, and empty-cell requirement.
  - `placeMove(position)` safely rejects invalid placements and, on valid moves, records ordered move history and alternates current player.
- Added game resolution logic in `Game`:
  - Evaluates all 8 Tic-Tac-Toe winning lines after each valid move.
  - Sets `status.winner` and `status.isOver` immediately when a winning line is formed.
  - Sets draw status when the board is full with no winner.
  - Prevents additional moves after game over through `canPlaceMove(position)`.

### CPU Move Selection
- CPU move selection is handled in gameplay UI turn effect when `currentPlayer` is `O`.
- Selection strategy uses deterministic minimax scoring:
  - Enumerates all legal open positions.
  - Simulates move outcomes recursively for both players until terminal state (CPU win, player win, or draw).
  - Chooses highest-scoring move for CPU, preferring faster wins and slower losses.
- Tie-breaking across equivalent scores uses fixed board priority (`[4, 0, 2, 6, 8, 1, 3, 5, 7]`) to keep behavior stable and testable.

### Gameplay Replay and Exit Controls
- Gameplay UI includes persistent `Home` control and a post-game-only `Play Again` control to support clear in-progress vs completed-game transitions.
- `Play Again` reconstructs a fresh `Game` instance in memory and rebinds gameplay state from `getState()` to guarantee a reset board, reset move list, `currentPlayer = X`, and non-terminal status.
- `Home` uses the app's route state navigation (`navigateTo("/")`) to return to the landing screen without page refresh.

### Quit Control During Active Game
- During in-progress gameplay (`status.isOver === false`), the secondary gameplay control is labeled `Quit`.
- `Quit` exits the current game flow by navigating to the landing route (`/`) via in-app history state (`pushState`), without browser refresh.
- After game completion (`status.isOver === true`), the same control remains an exit path and is labeled `Home`.

### Move Audio Feedback
- Gameplay UI synthesizes move feedback with the Web Audio API (`AudioContext`) instead of static audio assets.
- A short low-frequency "thud" is triggered only after `placeMove(position)` returns `true`, ensuring sound plays for valid placements only.
- Audio trigger is applied for both human and CPU move paths so each successful move has consistent feedback.
- Invalid or blocked move attempts produce no sound because their move placement calls return `false`.

### Move Validity Affordances
- Gameplay board derives a per-cell interactivity flag from `currentPlayer`, `status.isOver`, and `canPlaceMove(index)`.
- UI disables all non-interactive cells at the button level, so illegal placements are blocked directly in the interface before move handling.
- Board cells render explicit visual states:
  - `board-cell-available` for valid moves with a hover-highlight affordance.
  - `board-cell-blocked` for invalid or unavailable cells using muted styling and a not-allowed cursor.
- Click handler guards with `canPlaceMove(position)` before placement as a defensive check that matches UI state and game rules.

### Win/Loss Endgame Effects
- Gameplay UI watches for the `status.isOver` transition (`false -> true`) to trigger one-time endgame effects for each completed game.
- Outcome audio is synthesized with Web Audio API:
  - Player win (`winner = X`) triggers a short ascending victory chord.
  - Player loss (`winner = O`) triggers a short descending loss tone.
- Winning moves (`winner !== null`) trigger a transient confetti overlay rendered on the gameplay page.
- Loss outcomes (`winner = O`) render explicit text feedback: `Try again.`
- Existing move-thud audio remains tied to successful `placeMove` calls for both human and CPU turns; endgame sounds are additive and outcome-specific.

### Seeded Single-Player Route Support
- Single-player gameplay route recovery in `src/App.tsx` now supports an explicit seeded-entry path for automation-oriented scenarios:
  - `/game` continues to start a normal fresh single-player session by default.
  - `/game` with the dedicated single-player seed query parameter hydrates the gameplay screen from the provided `GameState` only when the seed validates successfully.
- Seed validation lives in `src/shared/game.ts`:
  - candidate board, moves, current player, and status shapes are validated
  - move history is replayed through the shared `Game` rules
  - the seed is accepted only when reconstructed authoritative state matches the provided snapshot exactly
- Invalid or malformed single-player seeds are ignored safely, falling back to the normal fresh single-player route behavior rather than partially hydrating inconsistent state.

### AWS S3 Static Website Infrastructure
- Added CloudFormation template at `infra/s3-static-website.yaml` to provision static hosting infrastructure for the app.
- Template provisions one S3 bucket configured with:
  - Static website hosting.
  - `index.html` as both index and error document to support SPA route refresh behavior.
  - Public read access for website objects through a bucket policy that grants only `s3:GetObject` on bucket objects.
- Bucket naming is constrained to include `ttt-ms-aj` via CloudFormation parameter validation.
- AWS setup automation now runs from `scripts/aws/setup-s3-website.ts`, compiled through npm before execution, to deploy/update the infrastructure with consistent stack and bucket naming.

### AWS S3 Build and Deploy Workflow
- AWS deploy automation now runs from `scripts/aws/deploy-s3-website.ts`, compiled through npm before execution, for repeatable production deployments.
- The deploy workflow:
  - Runs the production build before any upload.
  - Reads deployment configuration from `infra/dev.yaml`.
  - Syncs the generated `dist/` artifacts to the S3 website bucket with `aws s3 sync --delete`.
- Stack and bucket guardrails still require `ttt-ms-aj` in resource names for both explicit and default targets.

## Phase 2

### Multiplayer Service Foundation (US-30)
- Added `server/index.ts` as the initial Express backend scaffold for Phase 2 multiplayer work.
- Service exposes foundational operational endpoints:
  - `GET /health` for liveness metadata.
  - `GET /ready` for readiness confirmation that exercises the shared game domain.
- Shared game rules moved to `src/shared/game.ts` so both the browser app and backend service consume the same `Game` implementation and types without duplication.
- `src/game/Game.ts` now acts as a frontend-facing re-export layer over the shared module to preserve existing app imports.

### Create and List Multiplayer Games (US-31)
- Backend now keeps an in-memory multiplayer lobby registry inside `server/index.ts`.
- Added multiplayer lobby APIs:
  - `POST /games` creates a new waiting game and returns its join identifier.
  - `GET /games?status=waiting|active|over` returns lobby summaries filtered by status.
- The service enforces the documented Phase 2 capacity guardrail by rejecting game creation with HTTP 429 once 25 waiting or active games exist.
- Multiplayer lobby response contracts are shared through `src/shared/multiplayer.ts` so frontend and backend use the same status and summary shapes.
- Landing page multiplayer discovery is implemented in `src/App.tsx`:
  - `Start Multiplayer Game` creates a waiting lobby and shows the generated game identifier.
  - `Join Multiplayer Game` loads waiting lobbies from the backend and displays them without disrupting the existing single-player route flow.
- Frontend-to-backend calls are isolated in `src/multiplayer/api.ts`, with `VITE_MULTIPLAYER_API_BASE_URL` support for non-local backend URLs.

### Join Game and Start Multiplayer Match (US-32)
- Multiplayer game records now track explicit player slots in `server/index.ts`:
  - Player `X` is assigned when the host creates the waiting game.
  - Player `O` is assigned only by a successful join.
  - Waiting-to-active transition is stored explicitly when the second seat is filled.
- Added multiplayer session and snapshot contracts in `src/shared/multiplayer.ts` so client and server share the same shapes for:
  - Player assignments and join timestamps.
  - Full game snapshots used by create/join/detail responses.
  - Route/session metadata identifying the current player role.
- Added multiplayer session APIs:
  - `POST /games/{id}/join` joins one waiting game, promotes it to `active`, and rejects duplicate or invalid joins.
  - `GET /games/{id}` returns the authoritative current snapshot for that multiplayer game.
- Landing page and gameplay route flow in `src/App.tsx` now support multiplayer setup end to end:
  - Starting a multiplayer game navigates the host into gameplay as player `X` in `waiting` state.
  - Joining a listed waiting game navigates the second player into gameplay as player `O` in `active` state.
  - Multiplayer gameplay renders session-specific UI and carries the metadata needed for later authoritative move submission and refresh.
- Multiplayer gameplay includes a manual refresh path backed by `GET /games/{id}` so the host can reload session status after another player joins.

### Server-Validated Multiplayer Moves (US-33)
- The in-memory multiplayer store continues to hold the authoritative shared `Game` instance per `gameId`; `US-33` extends that same store instead of introducing a second multiplayer state model.
- Added `POST /games/{id}/moves` in `server/index.ts` for authoritative move submission:
  - Validates game existence and `active` status.
  - Validates that the submitted player has an assigned seat in the game.
  - Validates expected turn ownership against the shared `Game` instance.
  - Validates cell availability and terminal-state blocking through shared game-rule checks before mutating state.
  - Updates multiplayer record status from `active` to `over` when the shared game reaches a terminal state.
- Added shared move request/response contracts in `src/shared/multiplayer.ts` so the browser and backend reuse the same payload definitions for server-validated move submission.
- Multiplayer gameplay in `src/App.tsx` now submits moves to the backend instead of applying them locally:
  - Active multiplayer cells are interactive only for the current assigned player and only when the authoritative snapshot says the move is legal.
  - Successful move responses replace client state with the returned authoritative snapshot.
  - Invalid submissions surface server error messages in the multiplayer session UI without mutating client state optimistically.
- Gameplay route recovery now uses the existing `GET /games/{id}` path together with multiplayer query parameters (`gameId`, `player`, `mode`) so a browser refresh can reconstruct the multiplayer session and reload the authoritative snapshot.

### Live Multiplayer Updates via Websockets (US-34)
- `US-34` builds on the existing `US-33` authoritative move API instead of replacing it:
  - HTTP remains the mutation path for joins and moves.
  - Websocket delivery is an additive fan-out layer for live state updates.
- Added a lightweight websocket upgrade handler alongside Express in `server/index.ts`:
  - `WS /ws?gameId=...` subscribes a socket to one multiplayer game's event stream.
  - The server sends an initial `connection-ready` event with the current authoritative snapshot after subscription.
  - The server broadcasts `resync-needed` after join state changes, `move-applied` after successful server-validated moves, and `game-over` when a move ends the game.
- Shared websocket event payloads are defined in `src/shared/multiplayer.ts` so browser and backend reuse the same event schema for live updates.
- Multiplayer gameplay in `src/App.tsx` now maintains websocket lifecycle state:
  - Connects automatically for multiplayer sessions using the existing `gameId`.
  - Reconciles incoming websocket snapshots into the same route/session state used by `US-32` and `US-33`.
  - Surfaces connection states (`connecting`, `connected`, `reconnecting`, `unavailable`) so users can tell when live sync is degraded.
  - Preserves the `Refresh Match` HTTP fallback path when websocket delivery is unavailable or reconnect is in progress.

### Resign Multiplayer Game (US-35)
- `US-35` extends the existing multiplayer snapshot model rather than introducing a second game-result structure:
  - Multiplayer snapshots in `src/shared/multiplayer.ts` now include completion metadata with end reason, winner, loser, and completion timestamp.
  - The server maps both normal terminal move outcomes and resignation outcomes into that same completion shape.
- Added `POST /games/{id}/resign` in `server/index.ts`:
  - Validates game existence and active status.
  - Validates that the resigning player is assigned to the game.
  - Marks the game `over`, records resignation completion metadata, and prevents future move submissions through the existing active-game checks.
- Websocket fan-out reuses the existing `US-34` transport:
  - Added a `resigned` event carrying the authoritative updated snapshot and resigning player.
  - The existing `game-over` event is still published so live clients receive the same terminal-state snapshot path already used for completed move outcomes.
- Multiplayer gameplay in `src/App.tsx` now includes a multiplayer-only `Resign` control for active games:
  - Confirms user intent before calling the API.
  - Reconciles from the server response instead of mutating local state optimistically.
  - Leaves the board locked once the resignation-completed snapshot is applied.

### Spectate Active Games (US-36)
- `US-36` reuses the existing multiplayer read model and websocket transport from `US-32` through `US-35` instead of adding a second live-state path:
  - Discoverable spectate entry uses the existing `GET /games?status=active` lobby listing.
  - Initial spectator hydration uses the existing `GET /games/{id}` snapshot response.
  - Live spectator updates use the existing `WS /ws?gameId=...` subscription and existing authoritative snapshot events.
- Shared multiplayer session contracts in `src/shared/multiplayer.ts` now distinguish between:
  - Player sessions with an assigned `X` or `O` role.
  - Spectator sessions with no player seat and no mutation privileges.
- Multiplayer gameplay in `src/App.tsx` continues to use one route/state model for all multiplayer participants:
  - Active players retain move submission and resignation controls.
  - Spectators render the same authoritative board state as read-only, with spectator-specific labels and status/help messaging.
  - Route recovery continues to work after refresh through multiplayer query parameters, now including spectator sessions.

### Replay and Catch-Up Data Retention (US-37)
- `US-37` extends the existing multiplayer snapshot returned by `GET /games/{id}` and websocket events instead of introducing a separate replay endpoint:
  - Ordered move history continues to come from the shared `Game` state (`state.moves`).
  - Multiplayer game records now also retain ordered lifecycle events for creation, join, and completion.
- Multiplayer snapshots in `src/shared/multiplayer.ts` now include replay metadata:
  - `history.events` for lifecycle milestones that explain how the match progressed.
  - `history.retention` documenting that Phase 2 history retention remains in process memory and does not survive backend restarts.
- Multiplayer gameplay in `src/App.tsx` derives replay frames from retained move history:
  - Active games support catch-up review without mutating authoritative live state.
  - Completed games support step-through replay from the same gameplay route.
  - Player actions remain tied to live authoritative state only; replay mode disables move/resign mutations until the user returns to live view.

### Landing-Page Multiplayer Modal (US-38)
- `US-38` reuses the existing landing-page multiplayer create/join/spectate handlers from `US-31`, `US-32`, and `US-36` instead of adding new backend APIs or alternate frontend flows.
- `src/App.tsx` now presents one landing-page multiplayer CTA that opens a centered modal overlay:
  - The modal preserves the existing single-player CTA and landing-page layout underneath.
  - Close behavior is reversible through explicit close/cancel actions, escape key handling, and backdrop click handling.
- The modal keeps one shared player-name input and hosts the existing create, join, and spectate entry surfaces so later modal stories can extend one setup shell without duplicating entry-state management.

### Create Multiplayer Game from Modal (US-39)
- `US-39` extends the `US-38` modal shell instead of introducing a second create-game route or a duplicate landing-page host action.
- The existing `POST /games` flow now accepts a typed create payload shared by frontend and backend:
  - `playerName` identifies the hosting player for the waiting-game session.
  - `gameName` labels the created match and is retained in multiplayer summaries and snapshots.
- Shared validation limits for create-form inputs live in `src/shared/multiplayer.ts` so the modal and backend enforce the same field requirements without duplicate constants.
- `src/App.tsx` keeps create-state validation and request-failure messaging inside the modal while reusing the existing successful host-navigation path into gameplay as player `X`.

### Join or Spectate Multiplayer Games from Modal (US-40)
- `US-40` extends the existing modal shell and `US-39` create flow instead of restoring separate landing-page discovery panels or introducing new backend APIs.
- `src/App.tsx` now keeps one discovery mode in the multiplayer modal that:
  - Loads waiting and active games together through the existing `GET /games?status=waiting|active` endpoints.
  - Groups waiting games as joinable entries and active games as spectator-only entries inside the same list surface.
  - Reuses the existing `POST /games/{id}/join` and spectator `GET /games/{id}` navigation flows so modal actions still enter gameplay with the correct session role.
- Discovery refresh and explicit empty-state messaging remain local UI behavior layered on top of the existing multiplayer summary endpoints rather than a second discovery model.

### Dedicated Landing-Page Spectate Entry (US-44)
- `US-44` builds on the existing spectator session and gameplay support from `US-36` without changing backend contracts.
- `src/App.tsx` now exposes a dedicated `Spectate` trigger on the landing page in addition to the existing single-player and multiplayer entry points.
- The landing-page spectate flow uses its own modal state and reuses the existing `GET /games?status=active` discovery path so spectators see only active matches, not waiting or completed games.
- Selecting an active match from the spectate list still reuses the existing spectator navigation path into the multiplayer gameplay route with spectator session metadata.

### Abandonment Detection and Resolution (US-41)
- `US-41` extends the existing multiplayer game record, completion model, and websocket transport rather than adding a second timeout-specific state store.
- Multiplayer snapshots in `src/shared/multiplayer.ts` now include `activity` metadata for abandonment checks:
  - `lastProgressedAt` records the last join or valid move that advanced the match.
  - `awaitingPlayer`, `awaitingSince`, and `abandonmentDeadlineAt` describe whose required move is overdue and when the three-minute timeout window ends.
- Backend abandonment handling in `server/index.ts` now uses one authoritative path:
  - Join and valid move processing reset the active-turn abandonment window.
  - Reconnect-driven `GET /games/{id}` requests may refresh the timeout window only when the currently awaited player reloads with reconnect intent.
  - `POST /games/{id}/abandonment-check` closes only truly overdue active games, records `endReason = abandonment`, and declares the non-overdue side as winner.
- Websocket fan-out reuses the existing live-update channel:
  - Added an `abandoned` event carrying the updated snapshot and timed-out player.
  - The existing `game-over` event still publishes the final authoritative terminal snapshot for all clients.
- Multiplayer gameplay in `src/App.tsx` surfaces abandonment state without duplicating existing refresh or session flows:
  - Active player sessions show a timeout countdown and a `Check Timeout` action that calls the new server endpoint.
  - Status and replay text distinguish abandonment from wins, draws, and resignations.

### Phase 2 AWS Deployment and Low-Cost Operations (US-42)
- `US-42` builds on the existing server and client runtime behavior from `US-30` through `US-41`; it does not add new multiplayer game rules, alternate websocket behavior, or a second abandonment path.
- `infra/multiplayer-service-foundation.yaml` now provisions a deployable backend footprint:
  - one public EC2 instance running the existing Express and websocket service as a single long-lived process
  - one versioned S3 bucket for backend release bundles
  - IAM and Systems Manager access so backend releases can be pushed without SSH access or manual instance mutation
- Release automation stays split by runtime so frontend and backend remain independently deployable:
  - `scripts/aws/deploy-multiplayer-service.ts` builds `dist-server/`, uploads a release bundle, and triggers an in-place backend restart through Systems Manager
  - `scripts/aws/deploy-s3-website.ts` can resolve `BackendBaseUrl` from the backend stack and inject it into `VITE_MULTIPLAYER_API_BASE_URL` during the frontend build
- Operational model remains intentionally constrained for cost and simplicity:
  - one backend process handles both HTTP API traffic and websocket fan-out
  - multiplayer state, replay history, and abandonment tracking remain in process memory and are lost if the backend instance is replaced or restarted
  - the documented concurrency cap remains 25 waiting or active games, matching the existing in-memory store guardrail in `server/index.ts`
  - health checks continue to use `GET /health`, and readiness continues to use `GET /ready`
- Rollback expectations are release-bundle based rather than database-driven:
  - frontend rollback is the existing S3 asset redeploy path
  - backend rollback means redeploying a previous release bundle to the same instance because no persistent match state survives process replacement

### Planned Server-Backed Multiplayer Architecture
- Introduce a lightweight HTTP server API as the authoritative source of truth for multiplayer games.
- Keep the shared `Game` domain rules as the core move-validation engine, reused by the server for multiplayer game progression.
- Split responsibilities by runtime:
  - S3-hosted client handles UI, route state, and websocket subscriptions.
  - Multiplayer server handles game creation, joins, move validation, resignation, abandonment checks, and event fan-out.
- Model multiplayer games with lifecycle states: `waiting`, `active`, and `over`.

### Planned Realtime and Replay Model
- Websocket subscriptions are keyed by `gameId` and deliver authoritative server events to players and spectators.
- Server stores ordered game events and/or move history so late joiners can catch up and completed games can be replayed.
- Client should treat websocket events as the primary live-update channel after joining or spectating a game.

### Planned Multiplayer End-State Handling
- Normal move completion still follows Tic-Tac-Toe win/draw rules.
- Resignation ends the game immediately and declares the non-resigning side as winner.
- Abandonment is server-decided after 3 minutes without a required move; either client may trigger the abandonment check endpoint.

### Planned Infrastructure Direction
- Phase 1 S3 static website hosting remains the frontend delivery path.
- Added `infra/multiplayer-service-foundation.yaml` as the Phase 2 backend IaC entry point to capture expected service configuration before full backend resources are provisioned.
- Infrastructure as code will expand from that foundation into the multiplayer backend resources needed for low-cost AWS hosting.
