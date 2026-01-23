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
