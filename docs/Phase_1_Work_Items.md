# Phase 1 Work Items
Date: 2026-02-05

This document lists the Phase 1 epics, stories, and tasks for the Tic-Tac-Toe project. It is intended as a Jira-ready backlog, but no Jira items have been created yet.

## Epic 1: Deployment Baseline

### Story 1.1: Terraform S3 + CloudFront baseline
Acceptance Criteria:
1. Terraform provisions an S3 bucket and CloudFront distribution.
2. CloudFront URL serves a static placeholder page.
3. Uses existing AWS profile (when configured).

Tasks:
1. Create Terraform configuration for S3 bucket.
2. Create Terraform configuration for CloudFront distribution.
3. Add Terraform variables and outputs.

### Story 1.2: Manual deploy pipeline (local)
Acceptance Criteria:
1. Local build can be uploaded to S3.
2. CloudFront invalidation updates content.
3. QA can access updated site via CloudFront URL.

Tasks:
1. Document manual deployment steps.
2. Add scripts or commands for S3 upload.
3. Add CloudFront invalidation step.

---

## Epic 2: Foundation and Project Setup

### Story 2.1: Initialize React + TS app with Vite
Acceptance Criteria:
1. Deployed app shows “Coming Soon” placeholder.
2. `npm run build` succeeds without errors.

Tasks:
1. Create Vite React + TS project.
2. Add minimal app shell with placeholder content.

### Story 2.2: Add Tailwind CSS
Acceptance Criteria:
1. Deployed app renders Tailwind-styled placeholder.
2. Styling is consistent across modern browsers.

Tasks:
1. Install and configure Tailwind.
2. Apply base styles and theme tokens.

### Story 2.3: Documentation baseline
Acceptance Criteria:
1. `README.md` includes setup, build, test, deploy steps.
2. `context/` reflects current decisions.

Tasks:
1. Draft README sections.
2. Update context files if needed.

---

## Epic 3: UI/UX and Gameplay Flow

### Story 3.1: Landing screen with “Play vs CPU” and mark selection
Acceptance Criteria:
1. Landing page matches Phase 1 visual direction.
2. User can select X, O, or random.
3. QA can verify selection in deployed app.

Tasks:
1. Build landing layout and CTA.
2. Add mark selection controls.

### Story 3.2: Game board UI with inline status
Acceptance Criteria:
1. Deployed app shows board and inline status.
2. Status updates after each move.

Tasks:
1. Build board component.
2. Build status component.

### Story 3.3: Legal move enforcement with visual feedback
Acceptance Criteria:
1. Occupied squares are not clickable.
2. Hover shows valid/invalid move state.
3. Illegal moves cannot be made in UI.

Tasks:
1. Disable occupied squares.
2. Add hover styles.

### Story 3.4: Quit and Rematch flow
Acceptance Criteria:
1. “Quit” returns to landing and resets game state.
2. “Rematch” appears after game ends.
3. Rematch starting player is randomized.

Tasks:
1. Add Quit control and reset logic.
2. Add Rematch control and random start logic.

---

## Epic 4: Game Logic and CPU

### Story 4.1: Implement Game module
Acceptance Criteria:
1. Game module tracks state, move history, current turn, winner/draw.
2. Illegal moves are rejected by the module.
3. QA can complete a full game in deployed app.

Tasks:
1. Define board and move data structures.
2. Implement move application and validation.
3. Implement win/draw detection.

### Story 4.2: Deterministic smart-but-beatable CPU
Acceptance Criteria:
1. CPU blocks obvious wins.
2. CPU is deterministic for same board state.
3. CPU is not unbeatable.

Tasks:
1. Implement heuristic rules (win, block, center, corners, edges).
2. Add unit tests for CPU decisions.

---

## Epic 5: Audio and Visual Feedback

### Story 5.1: Sound effects with toggle
Acceptance Criteria:
1. “Thud” plays on valid move.
2. Win sound plays on player win.
3. Loss sound plays on player loss.
4. Sound toggle works in deployed app.

Tasks:
1. Source or generate free/licensed audio files.
2. Implement audio playback utility.
3. Add sound toggle UI.

### Story 5.2: Confetti on win
Acceptance Criteria:
1. Confetti triggers on win in deployed app.
2. Confetti is always enabled.

Tasks:
1. Select confetti library.
2. Trigger confetti on win.

---

## Epic 6: Quality and Automation

### Story 6.1: Unit tests for Game module
Acceptance Criteria:
1. Tests cover state, moves, turn switching, win/draw.
2. CPU determinism tested.
3. CLI test run passes.

Tasks:
1. Configure Vitest.
2. Write unit tests.

### Story 6.2: Playwright E2E tests for win and loss
Acceptance Criteria:
1. E2E test covers a full win flow.
2. E2E test covers a full loss flow.
3. Tests run via CLI.

Tasks:
1. Configure Playwright.
2. Implement win scenario.
3. Implement loss scenario.
