# Architecture

Last updated: 2026-03-09

## Phase 1

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

### AWS S3 Static Website Infrastructure
- Added CloudFormation template at `infra/s3-static-website.yaml` to provision static hosting infrastructure for the app.
- Template provisions one S3 bucket configured with:
  - Static website hosting.
  - `index.html` as both index and error document to support SPA route refresh behavior.
  - Public read access for website objects through a bucket policy that grants only `s3:GetObject` on bucket objects.
- Bucket naming is constrained to include `ttt-ms-aj` via CloudFormation parameter validation.
- Added executable helper script at `scripts/aws/setup-s3-website.sh` to deploy/update the infrastructure with consistent stack and bucket naming.

### AWS S3 Build and Deploy Workflow
- Added executable helper script at `scripts/aws/deploy-s3-website.sh` for repeatable production deployments.
- The deploy workflow:
  - Runs the production build before any upload.
  - Resolves the target bucket from the CloudFormation stack output when `BUCKET_NAME` is not provided.
  - Syncs the generated `dist/` artifacts to the S3 website bucket with `aws s3 sync --delete`.
- Stack and bucket guardrails still require `ttt-ms-aj` in resource names for both explicit and default targets.

## Phase 2

### Planned Server-Backed Multiplayer Architecture
- Introduce a lightweight HTTP server API as the authoritative source of truth for multiplayer games.
- Keep the existing `Game` domain rules as the core move-validation engine, reused by the server for multiplayer game progression.
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
- Infrastructure as code will expand to include the multiplayer backend resources needed for low-cost AWS hosting.
