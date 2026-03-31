# Architecture

## Implemented Scope

The app now spans a React client plus a lightweight in-memory multiplayer backend. The architecture is intentionally split so game rules stay reusable and testable while the server remains authoritative for multiplayer lifecycle rules.

## High-Level Design

- `src/app/App.tsx` owns application-level flow.
- `shared/contracts/multiplayer.ts` owns the shared Phase 2 multiplayer DTO and event definitions.
- `src/features/multiplayer/` owns browser-side API and mapping utilities for server-backed matches.
- `src/features/game/model/` owns pure game logic.
- `src/pages/` owns screen composition for landing and in-game views.
- `src/features/game/components/BoardPreview.tsx` owns board rendering and board input wiring.
- `src/styles/` owns global and app-level presentation.
- `server/` owns the in-memory multiplayer HTTP and WebSocket backend.

## Runtime Flow

### Landing Page

- The app starts on `LandingPage`.
- The user can choose `Play vs. CPU`, `Multiplayer Lobby`, or `Spectate Live Games`.
- `App.tsx` switches into the selected local, multiplayer, or spectator flow.

### Multiplayer Flow

- The lobby loads waiting games from `GET /games?status=waiting`.
- Creating a match calls `POST /games` and stores the returned `sessionId`.
- Joining a match calls `POST /games/{id}/join` and stores that player session.
- The match screen opens a WebSocket connection to `/ws?gameId=...`.
- The browser receives an immediate `game.snapshot` resync event, then ongoing join/move/resign/abandonment events.
- Local move requests go through `POST /games/{id}/moves`, while remote moves arrive asynchronously over the socket.

### Spectator Flow

- The spectator lobby loads active games from `GET /games?status=active`.
- Selecting a game first reads `GET /games/{id}` to load the current snapshot.
- The spectator screen then opens a WebSocket connection to `/ws?gameId=...`.
- The board is rendered read-only and updates when move or lifecycle events arrive from the server.

### Game Flow

- The human player is always `X`.
- The CPU is always `O`.
- The board click handler asks the pure game model whether the move is legal.
- If legal, `applyMove` produces the next immutable game state.
- After a human move, `App.tsx` waits briefly and then asks `chooseDeterministicCpuMove` for the CPU response.
- If the game ends in a win or draw, the UI changes messaging, highlights the winning line when relevant, and exposes `Rematch`.

## Game Domain Responsibilities

The game model in `src/features/game/model/game.ts` is intentionally UI-independent. It is responsible for:

- creating empty game state
- reconstructing state from a move sequence
- applying moves immutably
- validating move legality
- tracking ordered move history
- determining whose turn it is
- detecting winner, draw, and game-over state
- exposing available moves and winning line data

The CPU helper in `src/features/game/model/cpu.ts` is responsible for:

- picking a deterministic move for the CPU turn
- taking an immediate winning move when possible
- blocking an immediate opposing win when needed
- otherwise falling back to a stable priority order

## UI Responsibilities

The UI layer is responsible for:

- choosing which screen is visible
- displaying derived game state
- triggering CPU turns after player turns
- surfacing legal/illegal move feedback
- playing lightweight browser-generated sounds
- presenting win/loss/draw feedback

The UI does not define game rules directly. It consumes the domain module.

## Testing Strategy

- `tests/unit/game.test.ts` validates the pure game domain.
- `tests/e2e/single-player.spec.ts` validates the single-player browser flow through Playwright.
- `tests/e2e/multiplayer.spec.ts` validates both multiplayer play and spectator watching flows.
- `vitest.coverage.config.ts` combines the unit and server suites into one repeatable terminal coverage run.

This split is important for later phases because server-side validation can reuse the same game-domain concepts while browser tests continue to exercise end-to-end behavior.

## Phase 2 Story 2.1 Baseline

Story `2.1` adds the multiplayer contract baseline without implementing transport handlers yet.

- HTTP remains the planned command surface for create/list/join/move/resign/abandonment operations.
- WebSocket remains the planned async update surface for live multiplayer and spectator catch-up.
- Shared client/server DTOs and event payloads now live in `shared/contracts/multiplayer.ts`.
- The contract fixes Phase 2 constants for `25` concurrent games and a `3` minute abandonment timeout.
- Full details for the backend shape and payload design are in `docs/multiplayer-architecture.md`.

## Phase 2 Story 2.2 Baseline

Story `2.2` adds the first server-backed multiplayer HTTP surface.

- `server/multiplayer/service.ts` owns in-memory multiplayer game lifecycle logic.
- `server/http/createApp.ts` exposes the HTTP routes for create, list, join, move, resign, and abandonment-check.
- `server/index.ts` starts the API process.
- The server remains authoritative for turn validation and lifecycle transitions.
- WebSocket broadcasting is still deferred to Story `2.3`.

## Phase 2 Story 2.3 Baseline

Story `2.3` adds the realtime transport and catch-up path.

- `server/realtime/attachRealtimeServer.ts` attaches WebSocket upgrade handling at `/ws`.
- Subscribers receive a `game.snapshot` with `reason = resync` immediately on connect.
- The multiplayer service now publishes per-game events so join, move, resign, and abandonment changes can be broadcast asynchronously.
- Replay and catch-up use the full snapshot plus ordered move history rather than a separate replay endpoint.

## Phase 2 Story 2.4 Baseline

Story `2.4` adds the first visible multiplayer browser flow.

- `LandingPage.tsx` now exposes entry points for both single-player and multiplayer.
- `MultiplayerLobbyPage.tsx` supports create, refresh, and join flows for waiting games.
- `MultiplayerGamePage.tsx` renders a live multiplayer board and status messaging backed by server snapshots.
- `src/features/multiplayer/api.ts` owns the browser HTTP and WebSocket client calls.
- The board is updated by authoritative server snapshots rather than local rule execution.

## Phase 2 Story 2.5 Baseline

Story `2.5` hardens the server lifecycle rules already introduced in earlier stories.

- `server/multiplayer/service.ts` now enforces the concurrent multiplayer game cap before game creation.
- The server returns `429` when the cap is reached.
- Resign and abandonment paths are now explicitly covered for invalid or premature requests.
- The hardening work is verified through expanded server integration tests rather than new UI behavior.

## Phase 2 Story 2.6 Baseline

Story `2.6` closes Phase 2 with operational alignment work.

- deployment guidance now covers both the static frontend and the multiplayer API
- the multiplayer API can be packaged independently for infrastructure deployment
- the repo now includes a low-cost CloudFormation baseline for hosting the API on a single EC2 instance
- docs and scripts are aligned so multiplayer testing and deployment are callable from the terminal

## Phase 3 Story 3.1 Baseline

Story `3.1` extends the server data surface for spectator use without introducing spectator UI yet.

- `GET /games?status=active` is the active-game discovery path for future spectators.
- `GET /games/{id}` now returns the current snapshot for a selected game.
- the existing WebSocket transport already supports spectator-style subscriptions because it only requires `gameId`
- the goal of this story is server data exposure and contract alignment, not new browser screens

## Phase 3 Story 3.2 Baseline

Story `3.2` adds the first browser spectator experience.

- `LandingPage.tsx` now exposes a spectator entry point alongside local and multiplayer play.
- `SpectatorLobbyPage.tsx` lists active matches and lets the user choose one to watch.
- `App.tsx` now manages a separate spectator screen state, active-game loading, and spectator-specific WebSocket feedback.
- `MultiplayerGamePage.tsx` is now parameterized so it can render both player and spectator match views without duplicating board/status logic.

## Phase 3 Story 3.3 Baseline

Story `3.3` adds terminal-runnable coverage reporting for the tested domain and server layers.

- `package.json` now exposes `npm run coverage`.
- `vitest.coverage.config.ts` merges the unit and server suites into one coverage pass.
- Coverage artifacts are written to `coverage/` in text, HTML, and JSON-summary formats so local review and later CI can share the same command.
