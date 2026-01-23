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
