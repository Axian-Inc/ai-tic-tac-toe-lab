# Architecture

## Implemented Scope

Phase 1 is implemented as a client-only React application. There is no running backend yet. All gameplay state currently lives in browser memory for the active session.

The architecture is intentionally split so the game rules are reusable and testable before multiplayer/server work is added.

## High-Level Design

- `src/app/App.tsx` owns application-level flow.
- `shared/contracts/multiplayer.ts` owns the shared Phase 2 multiplayer DTO and event definitions.
- `src/features/game/model/` owns pure game logic.
- `src/pages/` owns screen composition for landing and in-game views.
- `src/features/game/components/BoardPreview.tsx` owns board rendering and board input wiring.
- `src/styles/` owns global and app-level presentation.
- `server/README.md` captures the intended backend ownership boundary until server code is added.

## Runtime Flow

### Landing Page

- The app starts on `LandingPage`.
- The user clicks `Play vs. CPU`.
- `App.tsx` creates a fresh game state and switches to the game page.

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
- `tests/e2e/single-player.spec.ts` validates the browser flow through Playwright.

This split is important for later phases because server-side validation can reuse the same game-domain concepts while browser tests continue to exercise end-to-end behavior.

## Phase 2 Story 2.1 Baseline

Story `2.1` adds the multiplayer contract baseline without implementing transport handlers yet.

- HTTP remains the planned command surface for create/list/join/move/resign/abandonment operations.
- WebSocket remains the planned async update surface for live multiplayer and spectator catch-up.
- Shared client/server DTOs and event payloads now live in `shared/contracts/multiplayer.ts`.
- The contract fixes Phase 2 constants for `25` concurrent games and a `3` minute abandonment timeout.
- Full details for the backend shape and payload design are in `docs/multiplayer-architecture.md`.
