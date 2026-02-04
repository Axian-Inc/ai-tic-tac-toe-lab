# Tic Tac Toe (React + TypeScript) — Developer Stories

## Epic A — Project setup and foundations

### Story A1 — Create React + TypeScript project scaffold
**As a developer,** I want a local-only React app scaffolded in TypeScript so I can build the game without backend dependencies.

**Acceptance criteria**
- App runs locally via standard scripts (dev server + build).
- TypeScript is enabled and strict mode is on.
- Linting + formatting configured (e.g., ESLint + Prettier).
- Project folder structure established (e.g., `src/game`, `src/pages`, `src/components`, `src/assets/audio`).
- No network calls required for gameplay.

---

### Story A2 — Define routing / page layout (Landing + Game Detail)
**As a user,** I want a landing page and a game page so navigation is clear.

**Acceptance criteria**
- Two routes:
  - `/` = Landing Page
  - `/game` (or `/game/:id`) = Game Detail page
- Global layout is consistent (title/header, content area).
- Navigation works without page refresh.

---

## Epic B — Core Game module (state + logic)

### Story B1 — Implement `Game` module data model
**As a developer,** I want a `Game` module that owns state and logic so UI stays simple and testable.

**Acceptance criteria**
- A `Game` module exists (e.g., `src/game/Game.ts`) that models:
  - Board state (3x3)
  - Moves so far (order + placement)
  - Current turn
  - Game status (in progress / over / quit)
  - Winner (if any)
- Strongly typed domain objects (e.g., `Player`, `Cell`, `Move`).
- Exposes a clear API (example):
  - `newGame()`
  - `getState()`
  - `isLegalMove(index)`
  - `makeMove(index)`
  - `getWinner()` / `getStatus()`
  - `reset()` / `quit()`
- No React imports inside the `Game` module.

---

### Story B2 — Implement win and draw detection
**As a developer,** I want deterministic detection of wins and draws so the UI can reflect outcomes correctly.

**Acceptance criteria**
- All 8 winning conditions are detected correctly.
- Draw is detected when the board is full and no winner exists.
- Once the game is over, state cannot transition back to in-progress.
- Winning move is recorded as the final move.

---

## Story B3 — Prevent illegal moves in the domain layer
**As a developer,** I want the `Game` module to reject illegal moves so rules are enforced regardless of UI behavior.

**Acceptance criteria**
- `makeMove` fails when:
  - The cell is already occupied
  - The game is over
  - The game has been quit
- Illegal moves do not mutate game state.
- Failure behavior is predictable and documented.

---

### Story B4 — Unit tests for `Game` module
**As a developer,** I want tests around core logic so I can refactor safely.

**Acceptance criteria (tests)**
- Tests cover:
  - Initial state
  - Move order and placement
  - Turn switching
  - Illegal move rejection
  - Win detection
  - Draw detection
- Tests are pure unit tests (no React rendering).
- Tests are runnable via a standard script.

---

## Epic C — CPU opponent (deterministic)

### Story C1 — Implement deterministic CPU strategy
**As a user,** I want to play against a CPU that always makes the same move given the same board.

**Acceptance criteria**
- CPU module accepts board + players and returns a move index.
- Given identical inputs, CPU always returns the same move.
- Strategy is documented (e.g., win > block > center > corner > side).
- CPU never returns an illegal move.

---

### Story C2 — Integrate CPU into game flow
**As a user,** I want the CPU to respond automatically after my move.

**Acceptance criteria**
- CPU move triggers automatically when it is the CPU’s turn.
- CPU does not play if the game is already over or quit.
- CPU moves are recorded like human moves.

---

### Story C3 — Tests for CPU behavior
**As a developer,** I want confidence that the CPU behaves deterministically and legally.

**Acceptance criteria (tests)**
- CPU produces the same move for the same board state.
- CPU blocks winning moves when available.
- CPU takes winning moves when available.

---

## Epic D — Landing page

### Story D1 — Landing page: start new game
**As a user,** I want to start a new game versus the CPU from the landing page.

**Acceptance criteria**
- Landing page greets the user.
- Primary CTA: “Play vs CPU”.
- Clicking CTA starts a new game and routes to the Game page.
- Player roles (human vs CPU) are clear and documented.

---

# Epic E — In-game UI and interaction

### Story E1 — Render board and enforce valid moves
**As a user,** I want to place pieces on the board and never make illegal moves.

**Acceptance criteria**
- Board is rendered as a 3x3 grid.
- Clicking an empty cell during human turn places a piece.
- Occupied cells and CPU turns cannot be interacted with.
- After game over, board is non-interactive.

---

### Story E2 — UI feedback for valid vs invalid moves
**As a user,** I want visual feedback showing which moves are valid.

**Acceptance criteria**
- Hovering over valid cells shows a clear affordance.
- Invalid cells do not show hover affordances.
- Keyboard focus states reflect the same rules.

---

### Story E3 — Game detail panel
**As a user,** I want to see whose turn it is and when the game ends.

**Acceptance criteria**
- Game detail panel displays:
  - Current turn
  - Game status
  - Winner or draw state
- Game-over UI is clearly distinguishable from in-progress state.

---

### Story E4 — Quit game
**As a user,** I want to quit a game at any time.

**Acceptance criteria**
- Quit button is always available during gameplay.
- Quitting stops the game and navigates back to Landing.
- Quit games do not trigger win/loss effects.

---

### Story E5 — Rematch after game over
**As a user,** I want to quickly play again after a game finishes.

**Acceptance criteria**
- “Rematch” option appears after game over.
- Board and game state reset correctly.
- Player roles and rules remain consistent.

---

## Epic F — Audio, celebration, and feedback

### Story F1 — Sound effects
**As a user,** I want audio feedback during gameplay.

**Acceptance criteria**
- Thud sound plays on successful move placement.
- Winning sound plays when the human wins.
- Losing sound plays when the human loses.
- Sounds do not trigger on illegal moves or quit.

---

### Story F2 — Confetti celebration on win
**As a user,** I want a celebration when I win the game.

**Acceptance criteria**
- Confetti triggers once when the human wins.
- Confetti does not trigger on loss, draw, or quit.

---

### Story F3 — Loss feedback
**As a user,** I want clear feedback when I lose.

**Acceptance criteria**
- “Try again” message is displayed.
- Visual feedback accompanies the loss.
- Losing sound plays once.

---

### Story G1 — Project documentation
**As a developer,** I want clear documentation to understand and run the project.

**Acceptance criteria**
- `README.md` includes:
  - Setup and run instructions
  - Architecture overview
  - CPU strategy description
  - Testing approach
  - Key design decisions

---

### Story G2 — Accessibility and UX polish
**As a user,** I want the game to be usable and accessible.

**Acceptance criteria**
- Board is playable via keyboard.
- Status updates are screen-reader friendly.
- Visual cues are not color-only.
- UI works on small screens.

---

## Epic H — Integration confidence

### Story H1 — Minimal integration tests
**As a developer,** I want confidence that core user flows work end to end.

**Acceptance criteria**
- Test covers starting a game and making moves.
- Test covers finishing a game and rematching.
- Tests are deterministic and repeatable.

## Epic I — AWS provisioning and deployment (Terraform + S3 + CloudFront)

--

### Story I1 — Terraform baseline for static site infrastructure
**As a developer,** I want Terraform to provision AWS infrastructure so the app can be hosted repeatably and safely.

**Acceptance criteria**
- A dedicated infrastructure directory exists (e.g., `terraform/`).
- Terraform provisions:
  - An S3 bucket for static site assets
  - A CloudFront distribution in front of the bucket
- Terraform configuration supports variables for:
  - AWS region
  - Project name
  - Environment (e.g., `dev`, `prod`)
  - Resource-name suffix, with default value of `-tg`.
- Terraform outputs include the CloudFront distribution domain name.
- `terraform fmt` and `terraform validate` pass successfully.

---

### Story I2 — Private S3 bucket with CloudFront-only access
**As a security-conscious developer,** I want the S3 bucket to be private and accessible only through CloudFront.

**Acceptance criteria**
- S3 bucket blocks all public access.
- CloudFront uses Origin Access Control (OAC) or Origin Access Identity (OAI).
- S3 bucket policy allows `s3:GetObject` only from the CloudFront distribution.
- Direct access to S3 object URLs is not possible.

---

### Story I3 — CloudFront configuration for SPA routing
**As a user,** I want deep links and page refreshes to work without errors.

**Acceptance criteria**
- CloudFront default root object is set to `index.html`.
- Unknown routes return `index.html` with HTTP 200 via:
  - Custom error response mapping (403/404 → `/index.html`), or equivalent.
- Behavior is documented for future maintainers.

---

### Story I4 — Static asset caching and performance defaults
**As a user,** I want the app to load quickly and efficiently.

**Acceptance criteria**
- CloudFront caching is enabled for static assets.
- Reasonable default TTLs are configured and documented.
- Cache behavior does not break application updates.

---

### Story I5 — Build and deploy workflow to AWS
**As a developer,** I want a repeatable way to deploy the built app to AWS.

**Acceptance criteria**
- Build output directory is clearly defined (e.g., `dist/` or `build/`).
- Deployment process:
  - Uploads build artifacts to S3
  - Sets correct `Content-Type` metadata
- CloudFront invalidation is triggered after deployment (e.g., `/*`).
- No manual AWS Console steps are required beyond credentials.

---

### Story I6 — Optional custom domain and TLS support
**As a user,** I want to access the app over HTTPS using a friendly domain (if available).

**Acceptance criteria**
- Terraform optionally supports:
  - ACM certificate in `us-east-1` for CloudFront
  - Route53 DNS records pointing to CloudFront
- Custom domain support is controlled via variables.
- App remains accessible via default CloudFront domain if custom domain is not configured.

---
### Story I7 — Deployment documentation and teardown
**As a developer,** I want clear instructions to deploy and remove infrastructure.

**Acceptance criteria**

- README includes a Deployment section describing:
  - Prerequisites (AWS credentials, Terraform installed)
  - Terraform workflow (`init`, `plan`, `apply`)
  - Application deployment steps
  - CloudFront invalidation process
  - Teardown via `terraform destroy`
- Common pitfalls are documented (e.g., ACM region for CloudFront).

# Epic J — Playwright end-to-end testing (CI-friendly)

## Goal

Create Playwright end-to-end coverage that can play a full game of Tic Tac Toe in the browser UI, including verifying **winning conditions**, and ensure both **unit tests** and **Playwright tests** are runnable from the command line for CI automation. Update the README “Testing approach” section to include Playwright.

---

## Epic J — Stories

### Story J1 — Add Playwright test framework and base configuration
**As a developer,** I want Playwright installed and configured so I can run deterministic browser-based tests locally and in CI.

**Acceptance criteria**
- Playwright is added as a dev dependency and initialized for the project.
- A Playwright config exists (e.g., `playwright.config.ts`) with:
  - Deterministic settings suitable for CI (headless by default)
  - A base URL matching the local dev server or preview server
- A dedicated E2E folder exists (e.g., `e2e/` or `tests/e2e/`).
- A standard command runs Playwright tests from CLI (e.g., `npm run test:e2e`).

---

### Story J2 — Provide a CI-friendly app runner for E2E tests
**As a developer,** I want E2E tests to run against a predictable server so CI can automate them.

**Acceptance criteria**
- There is a documented approach to run E2E tests against the built app or a preview server (choose one and standardize):
  - Option A: `npm run build` + `npm run preview` (recommended for Vite)
  - Option B: start dev server for tests
- Playwright config (or scripts) automatically starts/stops the server for tests (e.g., Playwright `webServer` config), OR scripts do so deterministically.
- Running `npm run test:e2e` works from a clean checkout with no manual steps besides installing dependencies.

---

### Story J3 — Implement stable selectors for the UI under test
**As a developer,** I want stable element selectors so Playwright tests don’t break on styling/layout changes.

**Acceptance criteria**
- Key UI elements include stable selectors (e.g., `data-testid`):
  - Landing page “Play vs CPU” button
  - Game status/turn label
  - Board cells (all 9)
  - Rematch button
  - Quit button
  - Winner message / “Try again” message
- Selectors are documented briefly in the test file header or README.

---

### Story J4 — Playwright script: start game and play a full deterministic game
**As a developer,** I want a Playwright test that starts from the landing page and plays a full game to completion.

**Acceptance criteria**
- A Playwright test:
  - Navigates to `/`
  - Clicks “Play vs CPU”
  - Plays moves via the UI until the game ends (win/loss/draw)
  - Asserts that the UI indicates game over
- The test is deterministic and does not rely on timing hacks (uses locators + expectations).
- The test does not attempt illegal moves.

--

### Story J5 — Playwright test: verify **human win** condition end-to-end
**As a user,** I want confidence that a human win is detected and reflected in the UI.

**Acceptance criteria**
- A Playwright test drives the UI to reach a **human winning state**.
- The test asserts:
  - UI shows “winner” (human) and game over
  - The winning state is consistent with a valid 3-in-a-row
- The test remains deterministic despite CPU behavior.

**Implementation notes (non-binding)**
- Prefer one of these approaches for determinism:
  - Use the deterministic CPU and pick a known sequence of human moves that guarantees a win
  - Or expose a test-only mode (e.g., query param) that sets the CPU strategy to a predictable stub for E2E

---

### Story J6 — Playwright test: validate win state invariants and “no further moves”
**As a developer,** I want to ensure that once a win occurs, the board is locked and status doesn’t regress.

**Acceptance criteria**
- After game over (win):
  - Clicking any empty cell does not change the board state
  - Status remains “Game Over”
  - Winner label remains correct
- If “Rematch” is pressed:
  - Board clears
  - Status resets to in-progress

---

### Story J7 — Command-line test entrypoints for unit + E2E
**As a developer,** I want consistent CLI commands so CI can run both unit and E2E tests.

**Acceptance criteria**
- Package scripts include:
  - `npm run test:unit` (or equivalent) to run unit tests
  - `npm run test:e2e` to run Playwright tests
  - `npm test` runs at least unit tests (optionally both)
- Commands exit non-zero on failure.
- Commands are documented in README.

---

## Story J8 — Update README “Testing approach” to include Playwright
**As a developer,** I want the README to explain the full testing strategy, including Playwright, so contributors know what to run.

**Acceptance criteria**
- README “Testing approach” section includes:
  - Unit test scope (Game module logic)
  - Playwright E2E scope (full user flows and winning condition verification)
  - How to run each from CLI
  - CI guidance (headless, server startup strategy)
- Notes about determinism are included (deterministic CPU and/or test mode).

# Phase 2 — Multiplayer + WebSockets (Epics K+)

## Primary goal
Practice **thoughtful, repeatable use of Generative AI** across the full development lifecycle (not just code gen): requirements, architecture, stories, testing, IaC, and project context management.

## Scope summary
Add a **multiplayer mode** backed by an **HTTP API server** that brokers games and broadcasts updates via **WebSockets**, while keeping Phase 1 single-player fully working (and Playwright tests still passing).

### Candidate API (server)
- `POST /games` (create)
- `GET /games?status=waiting|active|over`
- `POST /games/{id}/join`
- `POST /games/{id}/moves`
- `POST /games/{id}/resign`
- `POST /games/{id}/spectate` (or just websocket subscribe)
- `POST /games/{id}/abandonment-check`
- `GET /games/{id}` (recommended for replay/catch-up)
- `WS /ws?gameId=...`

### Key requirements
- Server validates commands, updates game state, and broadcasts events over WebSockets.
- Spectators can subscribe to a game (either players or 3rd parties).
- Abandonment: if the other client hasn’t moved for **3 minutes**, server marks game **over** and broadcasts winner.
- Either client can request an abandonment decision.
- No auth/identity.
- At most **25 concurrent multiplayer games**; exceed → **HTTP 429**.
- Enough data stored to replay old games and catch up live games.
- Tests cover key server behaviors.
- Client supports: create multiplayer game; join waiting game; receive async updates; play to win/lose.
- IaC updated for new infrastructure footprint in AWS with low cost.

### Exit criteria
- App supports **single-player** (Phase 1) and **multiplayer**.
- Single-player Playwright tests still pass.
- Multiplayer games: create/join, async updates via WebSockets, up to 25 concurrent, preserved move history, win/lose, resign, abandonment.
- IaC updated to provision and deploy new resources.

---

## Epic K — AI-assisted workflow and project context (repeatable)

### Story K1 — Establish a lightweight “memory bank” structure for project context
**As a developer,** I want an explicit project context structure so AI-assisted work remains consistent over time.

**Acceptance criteria**
- Repository contains an `AGENTS.MD` starter (already exists) and is extended with:
  - How to keep context current (what to update when requirements change)
  - Links/pointers to key docs
- Add a `docs/` folder with at least:
  - `docs/requirements-phase2.md`
  - `docs/architecture.md`
  - `docs/coding-standards.md`
  - `docs/api-contract.md`
- Docs are written so a new contributor (or AI) can understand scope and constraints quickly.

---

### Story K2 — AI-assisted requirement refinement and story enrichment process
**As a developer,** I want a repeatable process for using AI to refine requirements into implementable stories.

**Acceptance criteria**
- `docs/ai-workflow.md` describes:
  - Prompt templates for story enrichment
  - How to capture decisions + assumptions
  - How to validate output (tests, acceptance criteria)
- Include an example: “coarse requirement → refined story → test plan”.

---

### Story K3 — Update README to include Phase 2 architecture and commands
**As a developer,** I want the README to reflect the new server/client split and how to run everything locally.

**Acceptance criteria**
- README includes:
  - Local dev: client + server run commands
  - Multiplayer overview (HTTP + WS)
  - How to run unit + integration + Playwright tests from CLI
  - How to provision/deploy infra (Phase 2)

---

## Epic L — Multiplayer server foundation (HTTP API + WebSockets)

### Story L1 — Create server project skeleton and local dev scripts
**As a developer,** I want a server skeleton so I can implement HTTP + WS cleanly.

**Acceptance criteria**
- Server lives in a clear location (e.g., `server/`).
- Tech choice documented (Node/TS recommended for consistency, but any is fine if documented).
- Local run scripts exist (e.g., `npm run dev:server`, `npm run test:server`).
- Server exposes health endpoint (e.g., `GET /health`).

---

## Story L2 — Define domain model and event schema for multiplayer games
**As a developer,** I want a clear domain model and event schema so server/client stay consistent.

**Acceptance criteria**
- `docs/api-contract.md` defines:
  - Game states: `waiting | active | over`
  - Commands: create/join/move/resign/abandonment-check
  - Events broadcast over WS (examples):
    - `game_created`, `player_joined`, `move_accepted`, `move_rejected`, `game_over`, `abandoned`
  - Error shapes and status codes
- Event schema includes enough info for:
  - State catch-up
  - Spectator view
  - Move history replay

---

### Story L3 — Implement `POST /games` (create) and concurrency limit
**As a user,** I want to create a waiting multiplayer game.

**Acceptance criteria**
- `POST /games` creates a new game in `waiting` status and returns `{ id, status, createdAt }`.
- Server enforces a maximum of **25 concurrent games** (waiting + active). When exceeded:
  - returns **HTTP 429**
  - response includes a machine-readable error code.
- The created game is persisted in server storage (in-memory for dev is OK if Phase 2 also introduces persistence later).

---

### Story L4 — Implement `GET /games?status=...` (list games)
**As a user,** I want to find waiting games to join.

**Acceptance criteria**
- Supports `status=waiting|active|over` filter.
- Returns a list with enough metadata to display in UI (id, status, createdAt, updatedAt, moveCount).
- Does not leak identities (no auth).

---

### Story L5 — Implement `POST /games/{id}/join` and state transition to active
**As a user,** I want to join a waiting game and begin play.

**Acceptance criteria**
- Joining a `waiting` game transitions it to `active`.
- Once joined, additional join attempts fail (409 or 400; documented).
- Server assigns marks/turn rules deterministically (documented; e.g., creator = X goes first).
- Server emits/broadcasts `player_joined` event.

---

### Story L6 — Implement WebSocket endpoint `WS /ws?gameId=...`
**As a user,** I want real-time updates when remote moves happen.

**Acceptance criteria**
- Clients connect via `WS /ws?gameId=...`.
- Server validates game exists; otherwise closes with reason.
- On connect, server sends a catch-up payload (full state + history) OR a documented sequence of events.
- Multiple listeners supported (players + spectators).

---

## Epic M — Server command validation and gameplay

### Story M1 — Implement `POST /games/{id}/moves` with validation
**As a player,** I want to propose a move and have the server validate it.

**Acceptance criteria**
- Request includes `{ index }` (0–8) and any other required info (no auth, so server must infer “side” by session/connection strategy—documented).
- Server rejects illegal moves:
  - occupied cell
  - not your turn
  - game not active
- On success:
  - move is appended to history
  - game state updated
  - `move_accepted` event broadcast to all WS subscribers
- On failure:
  - HTTP error returned with a specific reason
  - optional `move_rejected` event broadcast (documented)

---

### Story M2 — Win/draw detection on server and `game_over` event
**As a player,** I want the server to end the game when a win or draw occurs.

**Acceptance criteria**
- Server detects win/draw after each accepted move.
- On game end:
  - status becomes `over`
  - winner/draw recorded
  - `game_over` event broadcast
- After game over, no further moves are accepted.

---

### Story M3 — Implement resign: `POST /games/{id}/resign`
**As a player,** I want to resign and end the game.

**Acceptance criteria**
- Resigning an `active` game sets it to `over`.
- Winner is set to the other side.
- `game_over` (or `resigned`) event broadcast to WS subscribers.
- Resigning a non-active game returns a documented error.

---

## Epic N — Spectating, catch-up, and replay

### Story N1 — Spectator mode via WebSockets
**As a spectator,** I want to observe a game in real time.

**Acceptance criteria**
- Any client can connect to WS for a given `gameId` and receive events.
- Spectators cannot submit moves (server rejects moves that aren’t from players per chosen identification strategy).
- Catch-up on connect includes full current state + history.

---

### Story N2 — Add `GET /games/{id}` for state retrieval (recommended)
**As a client,** I want to fetch authoritative game state to recover from disconnects.

**Acceptance criteria**
- Returns:
  - current board state
  - move history in order
  - status, winner/draw
  - timestamps (created/updated)
- Response matches the WS catch-up schema.

---

### Story N3 — Store enough data to replay old games
**As a user,** I want old games to be replayable.

**Acceptance criteria**
- Server retains game records beyond completion (at least for the life of the process; persistence addressed in Epic Q).
- API supports listing `over` games.
- Client can render move history (playback UI optional; at minimum display moves).

---

## Epic O — Abandonment detection

### Story O1 — Track last-move timestamp per game
**As a server,** I want to track inactivity so I can detect abandonment.

**Acceptance criteria**
- Server stores `lastMoveAt` for each game (updated on accepted moves and join/start).
- Timestamp logic is covered by tests.

---

### Story O2 — Implement `POST /games/{id}/abandonment-check`
**As a player,** I want to request an abandonment decision.

**Acceptance criteria**
- Endpoint evaluates inactivity:
  - If other player has not moved for **>= 3 minutes**, game becomes `over` and winner is declared.
  - Otherwise returns “not abandoned”.
- Decision is deterministic and documented.
- When abandonment ends a game, server broadcasts an event (`abandoned` or `game_over` with reason).

---

### Story O3 — Optional server-side sweeper for abandoned games (low-cost)
**As a server operator,** I want abandoned games to resolve even if no one calls the check.

**Acceptance criteria**
- A periodic job checks active games and resolves abandonment.
- Frequency is low-cost and configurable.
- Behavior is covered by tests (time control via fake timers).

---

## Epic P — Multiplayer client experience (Create/Join + realtime play)

### Story P1 — Update landing UI to include Multiplayer entrypoint
**As a user,** I want to start or join a multiplayer game from the landing page.

**Acceptance criteria**
- Landing page includes buttons for:
  - Play vs CPU (Phase 1)
  - New Multiplayer / Join Multiplayer
- Multiplayer flow uses a modal or dedicated page (UI inspired by provided mockups is acceptable).

---

### Story P2 — Create multiplayer game flow
**As a user,** I want to create a multiplayer game and share/join it.

**Acceptance criteria**
- Client calls `POST /games`.
- UI shows created game id and status `waiting`.
- Client connects to WS for that `gameId` and renders state updates.

---

### Story P3 — Join multiplayer game flow (list + join)
**As a user,** I want to see waiting games and join one.

**Acceptance criteria**
- Client calls `GET /games?status=waiting` to list.
- User selects a game and client calls `POST /games/{id}/join`.
- Upon join:
  - game becomes `active`
  - WS events update both clients

---

### Story P4 — In-game multiplayer board interactions
**As a user,** I want the same UI constraints as single-player (no illegal moves) while playing multiplayer.

**Acceptance criteria**
- Client only enables valid squares on the user’s turn.
- A move is submitted as a command to server; UI updates from server acceptance.
- If server rejects a move, UI shows a friendly error and board remains consistent.

---

### Story P5 — Realtime updates: remote moves + spectators
**As a user,** I want to see remote moves appear without refreshing.

**Acceptance criteria**
- On WS `move_accepted`, client updates board and move list.
- Late-joining spectator receives catch-up and then live events.
- Disconnect/reconnect fetches state (via WS catch-up and/or `GET /games/{id}`).

---

### Story P6 — Multiplayer role assignment and UI clarity (Player vs Spectator)
**As a user,** I want the UI to clearly show whether I’m Player X, Player O, or a spectator.

**Acceptance criteria**
- UI explicitly indicates current role:
  - `You are: Player X` / `You are: Player O` / `You are: Spectator`
- Turn indicator is clear and role-aware (e.g., “Your turn” only when applicable).
- Spectators see the board but cannot interact with it.

---

### Story P7 — Multiplayer “waiting room” experience
**As a user,** when I create a multiplayer game I want a clear waiting experience until another player joins.

**Acceptance criteria**
- When a game is created:
  - status shown as `Waiting for opponent…`
  - join/share info shown (game id + copy button)
- Board is disabled while waiting.
- When opponent joins (WS event):
  - UI transitions to active play state automatically

---

### Story P8 — Client-side handling for server capacity limit (HTTP 429)
**As a user,** I want a friendly message if the server is at capacity.

**Acceptance criteria**
- If `POST /games` returns 429:
  - UI shows an error banner/modal explaining capacity limit
  - user can retry later
- Error state does not break the app navigation.

---

### Story P9 — Multiplayer game list refresh and joinability feedback
**As a user,** I want to reliably see joinable games and avoid trying to join stale ones.

**Acceptance criteria**
- Available games list supports manual refresh.
- Join button disabled for non-waiting games.
- If a join attempt fails due to race condition (already joined):
  - UI shows “Game already started” and refreshes list.

---

### Story P10 — Robust WebSocket lifecycle (connect/reconnect/backoff)
**As a user,** I want the multiplayer experience to survive temporary connectivity issues.

**Acceptance criteria**
- Client handles:
  - initial connect
  - disconnect
  - reconnect with exponential backoff
- UI indicates connection status:
  - Connected / Reconnecting / Disconnected
- On reconnect, client requests/receives catch-up state.

---

### Story P11 — Multiplayer move submission UX (pending/confirmed)
**As a user,** I want to know whether my move was accepted by the server.

**Acceptance criteria**
- When user clicks a valid square:
  - UI enters a “pending move” state (e.g., disables board and shows spinner/label)
- When server confirms via event:
  - move is reflected and board re-enables appropriately
- If server rejects move:
  - UI displays reason
  - pending state clears

---

### Story P13 — Abandonment check UX and feedback
**As a user,** I want a way to check if the other player has abandoned the game.

**Acceptance criteria**
- UI provides an “Abandonment check” action during active games.
- Clicking triggers `POST /games/{id}/abandonment-check`.
- If abandonment is confirmed:
  - UI transitions to game over with winner
- If not abandoned:
  - UI shows “Opponent still active” (or similar) and continues game

---

### Story P14 — Multiplayer game over UX parity with Phase 1
**As a user,** I want win/loss/draw in multiplayer to feel as polished as single-player.

**Acceptance criteria**
- Game-over state clearly indicates:
  - winner mark (X/O)
  - whether you won/lost (role-aware)
- Confetti + win sound occur when *you* win.
- Losing sound + “Try again” feedback occur when *you* lose.
- Draw has neutral messaging.

---

### Story P15 — Quit vs Leave multiplayer game behavior
**As a user,** I want to leave a multiplayer game without confusing outcomes.

**Acceptance criteria**
- UI distinguishes:
  - Quit/Leave (client leaves the game view)
  - Resign (ends the game)
- Leaving a game:
  - disconnects WS
  - returns user to landing
  - does not automatically resign
- Documentation explains expected behavior.

---

### Story P16 — Multiplayer rematch behavior (explicitly not supported or implemented)
**As a user,** I want clarity on whether multiplayer supports rematches.

**Acceptance criteria**
- One of the following is implemented and documented:
  - **Option A:** Multiplayer rematch supported (creates a new game and invites opponent)
  - **Option B (acceptable):** Rematch button is hidden/disabled in multiplayer with message “Rematch not supported yet”

---

### Story P17 — Multiplayer error boundary and recovery
**As a user,** I want the app to recover gracefully from server errors.

**Acceptance criteria**
- If server returns 404 (game not found):
  - UI shows “Game not found” and offers navigation back
- If server returns 410/over state:
  - UI shows final game over state
- Unexpected errors show a friendly message and a recovery action.

---

### Story P18 — Multiplayer smoke tests (client-only)
**As a developer,** I want lightweight tests to ensure the client multiplayer flows don’t regress.

**Acceptance criteria**
- Client tests cover:
  - create game request success + 429 failure UI
  - join list rendering
  - WS event handling updates state
- Tests runnable from CLI.

---
