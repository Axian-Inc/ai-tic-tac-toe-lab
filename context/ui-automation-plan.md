# UI Automation Plan

Last updated: 2026-04-05

## Purpose

Define the plan to automate the manual UI cases in [ui-test-cases.md](/workspaces/ai-tic-tac-toe-lab/context/ui-test-cases.md) using Playwright with a Page Object Model, step-wrapped test execution, deterministic backend support hooks, and JUnit-compatible reporting.

## Current Framework State

- Playwright is already present in the repo at version `1.58.x`.
- The current Playwright configuration is TypeScript-based in [playwright.config.ts](/workspaces/ai-tic-tac-toe-lab/playwright.config.ts).
- Current reporting includes console `list` output plus JUnit XML.
- Current browser coverage is one Chromium project only.
- Current UI automation coverage includes the `UI-001` smoke test in [tests/e2e/gameplay.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/gameplay.spec.ts) plus targeted landing-page spectate and spectator-entry coverage aligned to the new dedicated spectate flow in [tests/e2e/spectate.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/spectate.spec.ts).
- The framework supports both frontend-only and coordinated frontend-plus-backend startup for UI tests.
- The framework currently assumes a browser launched inside the automation environment; RemoteCDP host-browser execution has not yet been added.
- Shared browser fixtures already construct page objects for landing, gameplay, multiplayer modal, and replay surfaces from [tests/e2e/fixtures/test-fixture.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/fixtures/test-fixture.ts).
- Step-wrapped execution is already implemented through [tests/e2e/support/step-async.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/support/step-async.ts), including failure screenshots with collision-safe attachment naming.
- Guarded backend automation hooks already exist in [tests/e2e/support/TestSupportApi.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/support/TestSupportApi.ts) and `server/index.ts` for reset, generic snapshot seeding, stale join, capacity seeding, and forced API failure setup.
- Stable automation selectors now cover landing-page controls, multiplayer modal, discovery, gameplay-session, replay, timeout, resignation-confirmation, and error surfaces in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx).

## Assumptions

- Automation will be organized in a Page Object Model.
- Tests will be written with a `StepAsync` wrapper so the automated fixture maps one-to-one to the manual test steps.
- JUnit XML will be produced for the overall run.
- Step-level execution detail should remain visible in the test output while being ignored by CI XML readers as pass/fail units.
- Manual test IDs remain the canonical automation naming source.
- RemoteCDP support is intended for interactive demo, debugging, and future maintenance workflows, not as the default CI execution mode.

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
  - open dedicated spectate flow
- `MultiplayerModal`
  - close button, backdrop, and escape handling
  - create flow
  - join flow
  - shared join/spectate discovery flow
  - dedicated landing-page spectate flow with active-games-only assertions
  - discovery refresh and error states
- `GameplayPage`
  - board interaction
  - status and outcome assertions
  - quit/home/play again
  - spectator role and player-role assertions
  - live sync indicator
  - refresh match
  - resign and timeout actions
  - resign confirmation dialog
  - abandonment countdown and multiplayer error states
- `ReplayPanel`
  - start, back, next, return to live
  - replay versus live mode assertions
- `TestSupportApi`
  - reset server state
  - seed waiting, active, replay, timeout, and capacity conditions through snapshot seeding helpers
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

### Runtime Modes

- Support a browser execution target configuration parameter with these values:
  - `Local`: Playwright launches and controls the browser in the container or automation runtime as it does today.
  - `RemoteCDP`: Playwright connects to a Chrome instance already running on the host through the Chrome DevTools Protocol for visible demo and debugging sessions.
- Keep `Local` as the default mode so CI and unattended local runs remain unchanged.
- When `RemoteCDP` is selected, force `workers = 1` regardless of the normal UI runtime mode because one visible host browser session must not be shared across parallel tests.
- RemoteCDP should remain compatible with the existing frontend-only versus full-stack runtime split; the browser target selection is an additional execution concern, not a replacement for `UI_AUTOMATION_MODE`.

## Coverage Plan

### Phase 1: Foundation

- [x] Establish the base automation layer: shared fixture, `StepAsync` helper, core page objects, and JUnit-capable reporter configuration.
- [x] Support both execution modes needed by the plan: frontend-only runs and coordinated frontend-plus-backend runs.
- [x] Serialize frontend-plus-backend Playwright runs until per-worker backend isolation exists.
- [x] Harden `StepAsync` attachment naming so repeated step titles cannot collide within one test's artifact output.
- [x] Add deterministic test data support before expanding coverage beyond smoke tests.
- [x] Add deterministic stale-join seeding so join-race failures can be exercised without timing-dependent setup.
- [x] Add stable selectors for multiplayer modal, gameplay-session, replay, timeout, resignation, and landing-page spectate surfaces.
- [x] Add observable multiplayer state hooks for session role, game status, sync state, replay mode, and abandonment countdown.
- [x] Replace browser-native resignation confirmation with an app-owned dialog that is stable for page-object automation.
- [x] Add a dedicated replay page object and expose it through the shared fixture layer.
- [x] Add targeted Phase 3 spectator-flow proof coverage so the new landing-page `Spectate` path is already exercised.
- [ ] Expand page-object helper methods so the full suite can assert modal-state variants and gameplay-state metadata without falling back to raw locators in individual specs.

### Phase 2: RemoteCDP Viewing and Debugging

- [x] Add a browser target configuration parameter with `Local` and `RemoteCDP` values.
- [x] Default the browser target to `Local` so current unattended execution behavior does not change.
- [x] When `RemoteCDP` is selected, connect Playwright to a host Chrome instance through CDP instead of launching the bundled local browser.
- [x] Add an override so RemoteCDP sessions cap active test workers at `1`.
- [x] Keep the existing frontend-only versus full-stack runtime split intact while layering browser-target selection on top.
- [x] Update [playwright.config.ts](/workspaces/ai-tic-tac-toe-lab/playwright.config.ts) and [tests/playwright/runtime.ts](/workspaces/ai-tic-tac-toe-lab/tests/playwright/runtime.ts) to read `UI_AUTOMATION_BROWSER_TARGET=Local|RemoteCDP`.
- [x] Add runtime resolution for the RemoteCDP endpoint through `UI_AUTOMATION_REMOTE_CDP_ENDPOINT`, defaulting to `http://host.docker.internal:9222`.
- [x] Create a fixture-level Playwright connection path for RemoteCDP sessions while preserving the current local-launch path for `Local`.
- [x] Route all existing e2e specs through the shared fixture layer so RemoteCDP support applies consistently across the suite.
- [x] Document a stable local-host browser startup command and the environment variables or command arguments required to connect from the container.
- [x] Verify that existing page objects, fixtures, and reporting remain unchanged above the browser-connection layer.
- Toggle note:
  - use `Local` for normal container-run automation
  - switch to `RemoteCDP` only when a visible host browser session is needed for demo or debugging
  - example toggle shape: `UI_AUTOMATION_BROWSER_TARGET=RemoteCDP npm run test:ui` or `UI_AUTOMATION_BROWSER_TARGET=RemoteCDP npm run test:ui:full`
  - in `RemoteCDP`, the runtime should default the app `baseURL` to a host-browser-reachable address such as `http://localhost:4173`; use `UI_AUTOMATION_BASE_URL` only as an explicit override when local host forwarding differs
- Host browser startup note:
  - assume the host user is running Chrome on a Windows PC and must start Chrome with remote debugging enabled before running the suite in `RemoteCDP` mode
  - example Windows PowerShell command:
    ```powershell
    & "C:\Program Files\Google\Chrome\Application\chrome.exe" `
      --remote-debugging-port=9222 `
      --remote-debugging-address=0.0.0.0 `
      --user-data-dir="C:\temp\chrome-dev" `
      --no-first-run `
      --no-default-browser-check
    ```
  - `--remote-debugging-address=0.0.0.0` is required when the container must connect to the host browser from outside the Windows desktop session
  - when the suite starts the frontend dev server for `RemoteCDP`, it must bind the Vite server to `0.0.0.0` so the host browser can reach the app instead of only the container loopback interface
  - use a dedicated `--user-data-dir` so the RemoteCDP Chrome instance does not fight with the user's normal Chrome profile
  - if the container cannot resolve the Windows host by default, document the host address the container should use for the CDP endpoint, such as `host.docker.internal` where supported
  - Chrome 146 host-browser sessions may reject DevTools HTTP discovery when the request `Host` header is a DNS name like `host.docker.internal`; prefer an IP-literal endpoint or a direct `ws://.../devtools/browser/...` endpoint when overriding `UI_AUTOMATION_REMOTE_CDP_ENDPOINT`

### Phase 3: Single-Player

- [x] Add dedicated Phase 3 single-player spec coverage in [single-player-core.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/single-player-core.spec.ts) and [single-player-outcomes.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/single-player-outcomes.spec.ts).
- [x] Automate `UI-001`.
- [x] Automate `UI-002`.
- [x] Automate `UI-003`.
- [ ] Automate `UI-004` end to end without conditional skip.
- [x] Automate `UI-005`.
- [x] Prioritize landing to gameplay navigation.
- [x] Prioritize move validation.
- [x] Prioritize quit, home, and play-again flows.
- [ ] Prioritize win and loss outcomes completely.
- [x] Prioritize draw outcomes.
- [x] Prioritize board lock after game over.
- [x] Use parameterized board-path helpers for winning-line coverage instead of duplicating long click scripts.
- [x] Verify the implemented single-player suite in `Local` mode.
- [x] Verify the implemented single-player suite in `RemoteCDP` mode.
- [ ] Close the remaining `UI-004` player-win gap through a later support change instead of weakening current CPU behavior.

### Phase 4: Multiplayer Modal and Discovery

- [ ] Automate `UI-006` through `UI-012`.
- [x] Use isolated browser contexts for host, joiner, and spectator roles.
- [x] Cover modal open and close paths.
- [x] Cover the dedicated landing-page `Spectate` entry.
- [x] Cover create validation and field boundaries.
- [x] Cover empty-state discovery.
- [x] Cover refresh behavior.
- [ ] Cover join and spectate entry paths.
- [x] Cover active-games-only spectator discovery.
- [x] Cover spectator gameplay entry from the dedicated landing flow.
- [x] Cover waiting host refresh to active.
- Phase 4 validation status:
  - local `UI_AUTOMATION_MODE=full` execution now passes `UI-006`, `UI-007`, `UI-008`, `UI-009`, and `UI-012`
  - `UI-010` remains skipped because the stale-join requirement is blocked by current product behavior rather than by remaining framework work
  - `UI-011` remains skipped because spectator live-update validation is deferred to the shared multiplayer gameplay coverage planned for Phase 5
  - Phase 4 is partially complete, but not closed

### Phase 5: Multiplayer Gameplay

- [ ] Automate `UI-013` through `UI-018`.
- [ ] Wire spectator-mode gameplay behaviors through the shared multiplayer gameplay automation surfaces so spectator sessions are covered alongside player sessions for live sync, refresh, replay, and role-specific controls.
- [ ] Complete `UI-011` end to end by restoring the skipped test and asserting spectator live-update behavior during an active match.
- [ ] Cover turn enforcement.
- [ ] Cover occupied-cell blocking.
- [ ] Cover live sync and refresh fallback.
- [ ] Cover role-based controls.
- [ ] Cover resign flow.
- [ ] Cover replay and return to live.
- [ ] Cover refresh recovery.
- [ ] Cover abandonment messaging and resolution.

### Phase 6: Error and Boundary Scenarios

- [ ] Automate `UI-019` and `UI-020`.
- [ ] Drive capacity, stale join, refresh failure, and create/discovery error paths through deterministic support hooks rather than brittle timing or manual backend manipulation.
- [ ] Reuse the same deterministic failure controls for both join-tab discovery and landing-page spectate discovery because both now depend on the same active-game listing path.

### Phase 7: Cleanup and Deferred Runtime Work

- [ ] Resolve the remaining `UI-004` player-win support gap without weakening production CPU behavior.
- [ ] Restore and complete `UI-010` after stale-join error visibility remains observable in the modal.
- [ ] Restore and complete `UI-011` after spectator-mode gameplay automation is fully wired.
- [ ] Resolve `RemoteCDP` full-mode multiplayer API reachability for host-browser execution.
- [ ] Restore `RemoteCDP` coverage for `UI-006`, `UI-007`, `UI-008`, `UI-009`, and `UI-012`.
- [ ] Re-run the deferred `RemoteCDP` Phase 4 subset and confirm it matches the local-mode pass/skip posture.
- [ ] Consolidate the final runtime and skip documentation after deferred tests are re-enabled.

## Execution Strategy

### Local Modes

- Single-player suite can run against the frontend app only.
- Multiplayer suite should start the frontend and backend together, or connect to a dedicated automation environment.

### Parallelism

- Keep single-player tests parallel-safe.
- Multiplayer tests that mutate shared backend state now run with one worker in `UI_AUTOMATION_MODE=full` until isolated backend instances are introduced.
- RemoteCDP sessions always run with one worker even when other runtime settings would allow more parallelism.

### Test Data

- Do not depend on naturally accumulated in-memory game state.
- Seed exact waiting, active, replay, timeout, and full-capacity conditions through the guarded backend test-support API before each affected test.
- Reset backend state between multiplayer tests through the same test-support API.

## Required Support Gaps

The baseline automation support gaps identified during Phase 1 foundation are now closed and documented in [ui-automation-code-changes.md](/workspaces/ai-tic-tac-toe-lab/context/ui-automation-code-changes.md). The remaining work is primarily suite-expansion work rather than app-support work:

- [ ] Broaden page-object methods and assertions so the remaining cases can stay manual-step-aligned without duplicating locator logic in specs.
- [ ] Add snapshot-builder helpers on top of the generic seed endpoint so replay, timeout, and role-specific multiplayer setups stay concise across tests.
- [x] Add runtime support for selecting `Local` versus `RemoteCDP` browser execution without changing existing CI defaults.
- [ ] Expand existing spectate coverage from proof coverage into full manual-case mapping for `UI-006`, `UI-011`, `UI-014`, `UI-015`, `UI-017`, and `UI-020`.
- [ ] Preserve stale-join join-tab error visibility after a failed join so `UI-010` can be automated end to end without skip.
- [ ] Resolve host-browser multiplayer API reachability so `RemoteCDP` full-mode coverage can be re-enabled for the deferred Phase 4 cases.

## Planned Deliverables

1. Base automation framework updates for POM, `StepAsync`, and JUnit reporting.
2. Runtime support for `Local` versus `RemoteCDP` browser execution.
3. Page objects and fixtures.
4. Deterministic test-support hooks.
5. Automated tests mapped to `UI-001` through `UI-020`.
6. Fill out coverage so the dedicated landing-page spectate flow and spectator gameplay cases map cleanly to the revised manual suite.
7. CI command updates once the suite is stable.

## Success Criteria

- Each manual UI case has a traceable automated counterpart or an explicit documented exclusion.
- Tests are deterministic locally and in CI.
- Multiplayer scenarios do not rely on ad hoc waits or manual backend setup.
- Test output is readable by engineers and consumable by CI through JUnit XML.
