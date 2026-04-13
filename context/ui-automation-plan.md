# UI Automation Plan

Last updated: 2026-04-13

## Purpose

Define the plan to automate the manual UI cases in [ui-test-cases.md](/workspaces/ai-tic-tac-toe-lab/context/ui-test-cases.md) using Playwright with a Page Object Model, step-wrapped test execution, deterministic backend support hooks, and JUnit-compatible reporting.

## Current Framework State

- Playwright is already present in the repo at version `1.58.x`.
- The current Playwright configuration is TypeScript-based in [playwright.config.ts](/workspaces/ai-tic-tac-toe-lab/playwright.config.ts).
- Current reporting includes console `list` output plus JUnit XML.
- Current browser coverage is one Chromium project only.
- Current UI automation coverage includes manual cases `UI-001` through `UI-020` across the Phase 3 through Phase 6 Playwright specs.
- The framework supports both frontend-only and coordinated frontend-plus-backend startup for UI tests.
- The framework now supports both Playwright-launched local browser execution and host-browser execution through `RemoteCDP`, with `Local` remaining the default mode.
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
  - when full-mode multiplayer flows depend on host-browser port forwarding, provide both explicit browser-visible overrides:
    `UI_AUTOMATION_BASE_URL=http://localhost:4173/`
    `UI_AUTOMATION_MULTIPLAYER_API_BASE_URL=http://localhost:3001`
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
- [x] Automate `UI-004` end to end without conditional skip.
- [x] Automate `UI-005`.
- [x] Prioritize landing to gameplay navigation.
- [x] Prioritize move validation.
- [x] Prioritize quit, home, and play-again flows.
- [x] Prioritize win and loss outcomes completely.
- [x] Prioritize draw outcomes.
- [x] Prioritize board lock after game over.
- [x] Use parameterized board-path helpers for winning-line coverage instead of duplicating long click scripts.
- [x] Verify the implemented single-player suite in `Local` mode.
- [x] Verify the implemented single-player suite in `RemoteCDP` mode.
- [x] Close the remaining `UI-004` player-win gap through a later support change instead of weakening current CPU behavior.
- Phase 3 update:
  - local execution now passes `UI-004` through the seeded single-player route support added for deterministic player-win coverage
  - `RemoteCDP` re-validation of the updated `UI-004` path remains pending until the requested developer-side cleanup pass reaches that verification step

### Phase 4: Multiplayer Modal and Discovery

- [x] Automate `UI-006` through `UI-012`.
- [x] Use isolated browser contexts for host, joiner, and spectator roles.
- [x] Cover modal open and close paths.
- [x] Cover the dedicated landing-page `Spectate` entry.
- [x] Cover create validation and field boundaries.
- [x] Cover empty-state discovery.
- [x] Cover refresh behavior.
- [x] Cover join and spectate entry paths.
- [x] Cover active-games-only spectator discovery.
- [x] Cover spectator gameplay entry from the dedicated landing flow.
- [x] Cover spectator live-update behavior during an active match.
- [x] Cover waiting host refresh to active.
- Phase 4 validation status:
  - local `UI_AUTOMATION_MODE=full` execution now passes `UI-006`, `UI-007`, `UI-008`, `UI-009`, `UI-010`, `UI-011`, and `UI-012`
  - `RemoteCDP` full-mode execution now passes `UI-006`, `UI-007`, `UI-008`, `UI-009`, `UI-010`, `UI-011`, and `UI-012` when the browser-visible frontend and backend overrides are supplied for the local host environment
  - Phase 4 is complete in both local and `RemoteCDP` full-mode execution when the explicit host-browser overrides are supplied

### Phase 5: Multiplayer Gameplay

- [x] Automate `UI-013` through `UI-018`.
- [x] Wire spectator-mode gameplay behaviors through the shared multiplayer gameplay automation surfaces so spectator sessions are covered alongside player sessions for live sync, refresh, replay, and role-specific controls.
- [x] Complete `UI-011` end to end by restoring the skipped test and asserting spectator live-update behavior during an active match.
- [x] Cover turn enforcement.
- [x] Cover occupied-cell blocking.
- [x] Cover live sync and refresh fallback.
- [x] Cover role-based controls.
- [x] Cover resign flow.
- [x] Cover replay and return to live.
- [x] Cover refresh recovery.
- [x] Cover abandonment messaging and resolution.
- Phase 5 validation status:
  - local `UI_AUTOMATION_MODE=full` execution passed `UI-013`, `UI-014`, `UI-015`, `UI-016`, `UI-017`, and `UI-018`
  - `RemoteCDP` full-mode execution now passes `UI-013`, `UI-014`, `UI-015`, `UI-016`, `UI-017`, and `UI-018` when the browser-visible frontend and backend overrides are supplied for the local host environment
  - Phase 5 is complete in both local and `RemoteCDP` full-mode execution when the explicit host-browser overrides are supplied

### Phase 6: Error and Boundary Scenarios

- [x] Automate `UI-019` and `UI-020`.
- [x] Drive capacity, stale join, refresh failure, and create/discovery error paths through deterministic support hooks rather than brittle timing or manual backend manipulation.
- [x] Reuse the same deterministic failure controls for both join-tab discovery and landing-page spectate discovery because both now depend on the same active-game listing path.
- Phase 6 validation status:
  - local `UI_AUTOMATION_MODE=full` execution passed `UI-019` and `UI-020`
  - `tests/e2e/multiplayer-errors.spec.ts` is now enabled for `RemoteCDP` full-mode execution
  - `RemoteCDP` full-mode execution now passes `UI-019` and `UI-020` when the documented localhost browser-visible overrides are supplied and the host Chrome session can already load `http://localhost:4173/` plus `http://localhost:3001/health` before the run begins

### Phase 7: Cleanup and Deferred Runtime Work

- [x] Resolve the remaining `UI-004` player-win support gap without weakening production CPU behavior.
- [x] Restore and complete `UI-010` after stale-join error visibility remains observable in the modal.
- [x] Restore and complete `UI-011` after spectator-mode gameplay automation is fully wired.
- [x] Resolve `RemoteCDP` full-mode multiplayer API reachability for host-browser execution through explicit browser-visible frontend and backend overrides.
- [x] Restore `RemoteCDP` coverage for `UI-006`, `UI-007`, `UI-008`, `UI-009`, and `UI-012`.
- [x] Re-enable the deferred `UI-013` through `UI-018` gameplay specs after the same multiplayer runtime blocker is removed.
- [x] Verify the restored Phase 5 gameplay specs in both local full-mode and `RemoteCDP` full-mode after multiplayer host-browser reachability is stable.
- [x] Re-run the deferred `RemoteCDP` Phase 4 subset and confirm it matches the local-mode pass/skip posture.
- [x] Consolidate the final runtime and skip documentation after deferred multiplayer tests are re-enabled.

### Phase 7 Closeout Notes

- Phase 3 through Phase 7 functional automation is complete.
- Manual cases `UI-001` through `UI-020` now have automated Playwright coverage.
- Carryover cleanup remains outside the core functional-case mapping:
  - expand page-object helpers so remaining maintained e2e specs do not need raw locators for modal-state or gameplay-state assertions
  - reconcile plan status, manual-case automation markers, and remaining skips so documentation matches the repo state before Phase 8 reporting work expands the output contract

### Application Change Plan For Requested Support Work

1. Single-player seeded entry for `UI-004`
- Add one application-owned single-player seed path that can initialize gameplay from a validated `GameState` without changing shipped CPU behavior for normal users.
- Keep the seed path explicit and narrow through either an automation-only query parameter or a history-state trigger.
- Validate that seeded board, move history, current player, and terminal status are internally consistent before the state is accepted.
- Update single-player gameplay initialization in `src/App.tsx` to hydrate `Game` from that validated state when the seed path is present, and otherwise preserve the current fresh-game path.
- Re-enable `UI-004` only after the seeded route can deterministically cover both player-win and CPU-win assertions.
  Status: local implementation and local `UI-004` verification complete; `RemoteCDP` re-verification still pending.

2. Join-error visibility for `UI-010`
- Refactor the landing-page modal discovery loaders in `src/App.tsx` so refresh-driven list updates do not always clear an active modal error before the user can observe it.
- Split error-reset behavior by intent: user-initiated mode changes may clear stale errors, but the failed-join follow-up refresh should preserve the join failure message.
- Keep the waiting-list refresh after stale-join failures so discovery still reconciles with backend truth, but do not wipe `multiplayerError` as part of that refresh path.
- Re-enable `UI-010` after the stale-join error remains visible through the refresh cycle and the modal stays stable.
  Status: implementation complete; local and `RemoteCDP` verification passed when explicit browser-visible frontend and backend overrides are supplied for the host environment.

3. `RemoteCDP` full-mode multiplayer API reachability
- Extend the runtime resolution in `tests/playwright/runtime.ts` so `RemoteCDP` full-mode runs can provide both a host-browser-reachable frontend `baseURL` and a host-browser-reachable multiplayer API base URL for the browser app itself.
- Prefer runtime-provided API origin injection over hard-coded container-local defaults so the host Chrome session does not fall back to `http://localhost:3001` when that address resolves incorrectly from the host machine.
- Preserve current defaults for local and CI runs; the new API-origin override must remain scoped to `RemoteCDP` full mode or explicit environment overrides.
- Re-run the deferred Phase 4 subset first (`UI-006` through `UI-009`, `UI-012`), then restore the deferred Phase 5 gameplay spec file once host-browser multiplayer paths are stable end to end.
  Status: implementation complete; the current local host environment requires `UI_AUTOMATION_BASE_URL=http://localhost:4173/` and `UI_AUTOMATION_MULTIPLAYER_API_BASE_URL=http://localhost:3001` in addition to a running Chrome `RemoteCDP` target.

### Phase 8: Step-Level JUnit Enrichment

Phase 8 readiness:
- The suite already emits JUnit XML to `test-results/playwright/junit.xml`.
- `StepAsync` is the canonical wrapper for manual-step-aligned execution, so step metadata should be captured from that layer instead of reconstructing steps later from reporter output.
- Phase 3 through Phase 7 functional coverage is complete, so Phase 8 can focus on reporting enrichment without needing to add new manual-case automation first.
- Pre-Phase-8 cleanup should keep the reporting surface predictable:
  - keep maintained e2e specs on the shared fixture and `StepAsync` path
  - clear stale skip and status documentation that would make enriched reporting look incomplete for reasons unrelated to the JUnit work itself

- [x] Extend the Playwright JUnit output path so `StepAsync` execution writes per-step metadata into the final `test-results/playwright/junit.xml` file without changing the existing one-test-per-manual-case contract.
- [x] Preserve step order exactly as executed within each owning test case.
- [x] Capture and embed, for each step:
  - [x] step name
  - [x] step outcome
  - [x] step duration
  - [x] step error summary when the step fails
- [x] Keep step failures attached to the parent test case that executed them instead of emitting child `<testcase>` elements.
- [x] Store the additional step metadata under JUnit properties or similarly ignorable nested metadata so standard CI and other JUnit readers continue to interpret only the existing test-level result fields.
- [x] Keep the existing test-level failure header and stack trace behavior unchanged while step-level failures include only concise error context summaries.
- [x] Preserve current attachment behavior so failure screenshots remain associated with the same test and can later be surfaced by the HTML report helper.
- [x] Define a stable embedded-data shape for step metadata so downstream tooling can read it without guessing.
- [x] Record step metadata only after the step finishes so status and duration reflect the authoritative outcome of the wrapped callback.
- [x] Ensure repeated step titles in one test can still be distinguished by preserving execution index in the serialized step payload.
- [x] Verify enriched JUnit output remains well-formed XML and remains consumable by existing repo-local JUnit consumers without changing the standard `testsuite`/`testcase` structure or test-level failure fields.
- Embedded data shape note:
  - prefer one opaque serialized payload per test case, stored in a custom property name that ordinary JUnit readers ignore
  - include at minimum `index`, `name`, `status`, `durationMs`, and optional `errorSummary`
  - keep the serialization deterministic so local and CI output are comparable
- Phase 8 verification note:
  - the checked-in GitHub Actions PR workflow currently runs `npm test` and `npm run build`, but does not upload or parse `test-results/playwright/junit.xml`
  - consumability verification for the enriched JUnit path is therefore based on preserving Playwright's standard JUnit suite/testcase structure, preserving the existing testcase-level failure and attachment fields, and confirming the generated XML parses successfully while the custom `pw:step-metadata` property remains ignorable metadata
  - targeted verification covered both a deliberately failed `StepAsync` step and repeated identical step titles before removing the temporary probe specs used for those checks

### Phase 9: HTML Report Helper From Final JUnit

- [x] Establish the repo-local helper foundation under `scripts/test/` and keep it runnable through `tsx` rather than expanding the compiled AWS-script TypeScript surface.
- [x] Read from the final Playwright JUnit output file rather than a second intermediate artifact.
- [x] Normalize standard JUnit testcase data plus embedded `pw:step-metadata` into a report model before HTML rendering begins.
- [x] Reserve a stable paired HTML artifact path at `test-results/playwright/report.html` alongside the final `test-results/playwright/junit.xml` artifact.
- [x] Add a stable repo command (`npm run test:ui:report`) so JUnit and HTML-report generation can remain paired artifacts for any UI automation run.

Phase 9 progress note:
- The groundwork items above are now implemented in code and covered by targeted unit tests.
- The remaining standalone HTML-report requirements were moved to Phase 10 so Phase 9 remains the parser/helper groundwork milestone.

### Phase 10: Standalone HTML Report Rendering

Phase 10 purpose:
- Complete the user-facing HTML artifact on top of the Phase 9 parser/model foundation without changing the existing JUnit contract.
- Keep `junit.xml` as the standard machine-consumed artifact and generate `report.html` as the richer human-consumed companion artifact.

Phase 10 scope note:
- CI upload/publishing behavior remains out of scope for this phase.
- The HTML artifact must still be generated locally as a stable file under `test-results/playwright/` whenever the helper is run against a JUnit result.

- [x] Extend the helper so it writes a standalone HTML report to `test-results/playwright/report.html` by default.
- [x] Render a report header titled `Test Report - Tic Tac Toe`.
- [ ] Include run-level summary fields near the top of the report:
  - [x] run identifier when available
  - [x] time run started
  - [x] branch name when it can be determined in local or CI execution
  - [x] total tests
  - [x] passed
  - [x] failed
  - [x] skipped
- [x] Add a graphical summary chart for passed, failed, and skipped totals.
- [x] Render one result row per test case that includes:
  - [x] test name
  - [x] fixture name
  - [x] status
  - [x] time of test execution
  - [x] artifacts
- [x] Keep `File Artifacts` in the artifacts cell as a compact expandable section.
- [x] Render `Steps (# steps executed)` as its own expandable full-width detail row under the owning test row so step details are not constrained by the artifacts-column width.
- [x] Keep `File Artifacts` static for the initial HTML implementation and point users to the known Playwright artifact tree under `test-results/playwright/artifacts`.
- [x] When the step detail row is expanded, render a table with:
  - [x] step
  - [x] status
  - [x] time
  - [x] error
- [x] Populate the step table from the embedded JUnit step payload so failed-step error text matches the concise `errorSummary` captured in Phase 8.
- [x] Render failed test cases with a dedicated full-width failure-details section that shows an error summary plus the full failure stack trace, while individual steps continue to show only the concise step-level summary.
- [x] Derive fixture name from available JUnit testcase metadata where possible; when Playwright does not emit a direct fixture field, keep using classname-based inference and document that inference in the implementation.
- [x] Resolve branch name from CI environment variables first, then local git branch resolution as a fallback, and omit the field gracefully when neither source is available.
- [x] Surface run identifier when available and omit it gracefully when unavailable locally.
- [x] Keep the generated HTML self-contained enough for artifact publishing with no live server requirement.
- [x] Add targeted unit coverage for branch/run metadata resolution and HTML rendering behavior.
- [x] Validate the generated HTML against a JUnit file containing passed, failed, and skipped tests.
- [x] Validate at least one failed-step case so the rendered steps table shows the embedded concise error summary.
- [x] Validate that the generated HTML remains useful when branch name or run identifier cannot be determined locally.

4. Verification and documentation sequence
- Validate each application change locally before re-enabling the blocked automation: targeted typecheck and affected Playwright specs for the single-player seed path, `UI-010` in local full mode, and then the deferred `RemoteCDP` Phase 4 subset followed by Phase 5 gameplay coverage.
- Update `context/ui-automation-code-changes.md`, `context/ui-test-cases.md`, `context/testing-strategy.md`, and `context/architecture.md` as each requested support item moves from planned to implemented.

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
- [ ] Re-enable the currently skipped Phase 5 gameplay suite after multiplayer runtime cleanup restores a stable end-to-end posture across the deferred multiplayer phases.

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
