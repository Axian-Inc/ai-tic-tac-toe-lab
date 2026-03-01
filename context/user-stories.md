# User Stories

Last updated: 2026-03-01

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

## Epic 5: Quality and Readiness

### US-16 Core Logic Test Coverage
As a developer, I want tests for game logic so that regressions are caught quickly.

Acceptance criteria:
- Tests cover move validation.
- Tests cover turn switching.
- Tests cover win detection for representative lines.
- Tests cover draw detection and post-game move blocking.
