# UI Automation Plan

Last updated: 2026-03-30

## Purpose

Define the plan to automate the manual UI cases in [ui-test-cases.md](/workspaces/ai-tic-tac-toe-lab/context/ui-test-cases.md) using Playwright with a Page Object Model, step-wrapped test execution, and JUnit-compatible reporting.

## Current Framework State

- Playwright is already present in the repo at version `1.58.x`.
- The current Playwright configuration is TypeScript-based in [playwright.config.ts](/workspaces/ai-tic-tac-toe-lab/playwright.config.ts).
- Current reporting includes console `list` output plus JUnit XML.
- Current browser coverage is one Chromium project only.
- Current UI automation coverage includes the `UI-001` smoke test in [tests/e2e/gameplay.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/gameplay.spec.ts) plus targeted spectate coverage in [tests/e2e/spectate.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/spectate.spec.ts).
- The framework supports both frontend-only and coordinated frontend-plus-backend startup for UI tests.
- Stable automation selectors now cover multiplayer modal, discovery, gameplay-session, replay, timeout, resignation, and error surfaces in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx).

## Assumptions

- Automation will be organized in a Page Object Model.
- Tests will be written with a `StepAsync` wrapper so the automated fixture maps one-to-one to the manual test steps.
- JUnit XML will be produced for the overall run.
- Step-level execution detail should remain visible in the test output while being ignored by CI XML readers as pass/fail units.
- Manual test IDs remain the canonical automation naming source.

## Target Automation Shape

### Test Organization

- Keep one automated test per manual test case ID where practical, for example `UI-001`, `UI-002`, and so on.
- Preserve manual step order inside each test through `await StepAsync("Step name", async () => { ... })`.
- Group tests by feature area:
  - `SinglePlayer`
  - `MultiplayerModal`
  - `MultiplayerGameplay`
  - `Replay`
  - `RecoveryAndErrors`

### Page Object Model

- `LandingPage`
  - launch app
  - start CPU game
  - open multiplayer modal
- `MultiplayerModal`
  - close button, backdrop, and escape handling
  - create flow
  - join flow
  - spectate flow
  - discovery refresh and error states
- `GameplayPage`
  - board interaction
  - status and outcome assertions
  - quit/home/play again
  - live sync indicator
  - refresh match
  - resign and timeout actions
- `ReplayPanel`
  - start, back, next, return to live
- `TestSupportApi`
  - reset server state
  - seed waiting, active, replay, timeout, and capacity conditions
  - enable deterministic failure scenarios

### Fixture and Step Wrapper

- Build a shared fixture layer that creates the required page objects for each test.
- Add a `StepAsync` helper that:
  - wraps a single manual step
  - logs the step name into the Playwright test output
  - captures attachments on failure
  - keeps assertions inside the step body
- The fixture should expose page objects and helper services so tests read as manual-step translations rather than raw locator scripts.

### Reporting

- Configure JUnit output for the run.
- Treat step detail as nested reporting metadata rather than standalone test cases so CI continues to interpret one XML test per manual case.
- Preserve human-readable step output in console, trace, and attachments.

## Coverage Plan

### Phase 1: Foundation

- [x] Establish the base automation layer: shared fixture, `StepAsync` helper, core page objects, and JUnit-capable reporter configuration.
- [x] Support both execution modes needed by the plan: frontend-only runs and coordinated frontend-plus-backend runs.
- [x] Serialize frontend-plus-backend Playwright runs until per-worker backend isolation exists.
- [x] Harden `StepAsync` attachment naming so repeated step titles cannot collide within one test's artifact output.
- [x] Add deterministic test data support before expanding coverage beyond smoke tests.
- [x] Add deterministic stale-join seeding so join-race failures can be exercised without timing-dependent setup.

### Phase 2: Single-Player

- Automate `UI-001` through `UI-005`.
- Prioritize:
  - landing to gameplay navigation
  - move validation
  - quit/home/play again
  - win/loss/draw outcomes
  - board lock after game over
- Use parameterized board-path helpers for winning-line coverage instead of duplicating long click scripts.

### Phase 3: Multiplayer Modal and Discovery

- Automate `UI-006` through `UI-012`.
- Use isolated browser contexts for host, joiner, and spectator roles.
- Cover:
  - modal open and close paths
  - create validation and field boundaries
  - empty-state discovery
  - refresh behavior
  - join and spectate entry paths
  - waiting host refresh to active

### Phase 4: Multiplayer Gameplay

- Automate `UI-013` through `UI-018`.
- Cover:
  - turn enforcement
  - occupied-cell blocking
  - live sync and refresh fallback
  - role-based controls
  - resign flow
  - replay and return to live
  - refresh recovery
  - abandonment messaging and resolution

### Phase 5: Error and Boundary Scenarios

- Automate `UI-019` and `UI-020`.
- Drive capacity, stale join, refresh failure, and create/discovery error paths through deterministic support hooks rather than brittle timing or manual backend manipulation.

## Execution Strategy

### Local Modes

- Single-player suite can run against the frontend app only.
- Multiplayer suite should start the frontend and backend together, or connect to a dedicated automation environment.

### Parallelism

- Keep single-player tests parallel-safe.
- Multiplayer tests that mutate shared backend state now run with one worker in `UI_AUTOMATION_MODE=full` until isolated backend instances are introduced.

### Test Data

- Do not depend on naturally accumulated in-memory game state.
- Seed exact waiting, active, replay, timeout, and full-capacity conditions through the guarded backend test-support API before each affected test.
- Reset backend state between multiplayer tests through the same test-support API.

## Required Support Gaps

The current implementation is sufficient for basic smoke coverage, but not for reliable full-suite automation. A separate support document has been added at [ui-automation-code-changes.md](/workspaces/ai-tic-tac-toe-lab/context/ui-automation-code-changes.md).

## Planned Deliverables

1. Base automation framework updates for POM, `StepAsync`, and JUnit reporting.
2. Page objects and fixtures.
3. Deterministic test-support hooks.
4. Automated tests mapped to `UI-001` through `UI-020`.
5. CI command updates once the suite is stable.

## Success Criteria

- Each manual UI case has a traceable automated counterpart or an explicit documented exclusion.
- Tests are deterministic locally and in CI.
- Multiplayer scenarios do not rely on ad hoc waits or manual backend setup.
- Test output is readable by engineers and consumable by CI through JUnit XML.
