# UI Automation Support Code Changes

Last updated: 2026-04-13

## Summary

The baseline support changes required for deterministic Playwright expansion are now in place. The application and backend now expose automation-stable selectors, a guarded backend test-support API, an app-owned resign confirmation dialog, and serialized full-mode runtime behavior for the shared multiplayer backend.

## Feature: Stable Automation Selectors

Implemented dedicated `data-testid` attributes for multiplayer and replay surfaces in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx).

Required additions:
- [x] multiplayer modal container
- [x] modal close button
- [x] player-name input
- [x] game-name input
- [x] create tab button
- [x] join tab button
- [x] create submit button
- [x] create cancel button
- [x] discovery refresh button
- [x] modal error message
- [x] empty-state message
- [x] waiting games list
- [x] active games list
- [x] per-game cards keyed by game ID
- [x] join and spectate buttons keyed by game ID
- [x] multiplayer session card
- [x] match ID text
- [x] live sync status
- [x] refresh match button
- [x] gameplay error message
- [x] replay panel
- [x] replay start, back, next, and return-to-live buttons
- [x] resignation button
- [x] timeout button
- [x] loss-feedback text

Why:
- Current automation would otherwise depend heavily on visible text and DOM shape, which will make the suite brittle.

## Feature: Deterministic Test Support API

Implemented test-only support endpoints in [server/index.ts](/workspaces/ai-tic-tac-toe-lab/server/index.ts), guarded behind `AUTOMATION_TEST_SUPPORT=1`.

Required capabilities:
- [x] reset in-memory game state
- [x] seed waiting game
- [x] seed active game with chosen board state and player assignments
- [x] seed replay history and lifecycle events
- [x] seed abandonment state with configurable remaining time or expired deadline
- [x] seed store to 25 waiting-or-active games for capacity testing
- [x] mark one game as already joined to drive stale-join failure deterministically
- [x] optionally force specific API failures for create, discovery, detail refresh, join, resign, move, and abandonment-check paths

Why:
- Manual timing and shared in-memory state are not reliable enough for CI automation.

Implementation note:
- Added `POST /test-support/seed/stale-join` so automation can present a waiting-list entry that deterministically fails `POST /games/{id}/join` with `not_joinable`.

## Feature: Deterministic Confirmation Handling

Replaced direct `window.confirm` usage for resignation in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx) with an app-owned confirmation dialog.

Why:
- Native browser confirms are automatable, but they are less observable and harder to standardize inside a page-object pattern and step wrapper.
- An app-owned dialog would also allow stable selectors and clearer assertions.

## Feature: Observable Multiplayer State Hooks

Exposed stable test hooks for state that was previously only inferable from prose text.

Recommended additions:
- [x] current session role
- [x] game lifecycle status
- [x] replay active versus live mode
- [x] abandonment countdown container
- [x] sync state value

Why:
- Several manual cases depend on verifying role, state transitions, and replay/live mode without relying on exact user-facing copy.

## Feature: Replay Page Object Surface

Added a dedicated replay page object in [tests/e2e/page-objects/ReplayPanel.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/page-objects/ReplayPanel.ts) and exposed it through the shared fixture in [tests/e2e/fixtures/test-fixture.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/fixtures/test-fixture.ts).

Why:
- The automation plan treats replay controls as a first-class surface, so tests should not have to fall back to raw locators for replay-only interactions.

## Feature: Automation-Friendly Environment Startup

Provided a dedicated automation startup path in repo scripts and configuration.

Recommended additions:
- [x] one command for frontend-only UI automation
- [x] one command for frontend plus backend plus test-support API
- [ ] optional isolated backend port configuration per worker if multiplayer parallelism is expanded later

Why:
- The full-mode Playwright runtime now provides the deterministic automation contract; isolated backend ports remain a future optimization if worker parallelism is expanded.

## Feature: RemoteCDP Host Browser Support

Added browser-target runtime support so UI automation can run either against a Playwright-launched local browser or a host Chrome instance exposed through RemoteCDP.

Required additions:
- [x] browser target selection through `UI_AUTOMATION_BROWSER_TARGET=Local|RemoteCDP`
- [x] RemoteCDP endpoint override through `UI_AUTOMATION_REMOTE_CDP_ENDPOINT`
- [x] forced worker cap of `1` for RemoteCDP sessions
- [x] fixture-level `connectOverCDP(...)` path that preserves the existing local browser flow as the default
- [x] RemoteCDP support applied through the shared e2e fixture layer so specs do not need browser-mode-specific code

Why:
- Demo, maintenance, and future UI debugging workflows need a visible host browser outside the container without changing the default CI/browser behavior.

## Feature: Shared Multiplayer Gameplay Automation Surface

Extended the shared Playwright support layer for upcoming Phase 5 gameplay coverage.

Implemented additions:
- [x] broader multiplayer gameplay assertions in [GameplayPage.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/page-objects/GameplayPage.ts) for session role, game status, live-sync state, help/error messaging, abandonment countdown, replay/live mode, resign dialog, timeout control, and board interactivity
- [x] broader replay assertions in [ReplayPanel.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/page-objects/ReplayPanel.ts) for replay mode, title/summary text, and button disabled states
- [x] deterministic multiplayer browser-session entry helpers in [MultiplayerBrowserSession.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/support/MultiplayerBrowserSession.ts) for direct player and spectator route entry
- [x] reusable seeded multiplayer snapshot builders in [multiplayer-test-data.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/support/multiplayer-test-data.ts) and [TestSupportApi.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/support/TestSupportApi.ts) for active, replay, and abandonment-oriented setups

Why:
- Phase 5 coverage depends on asserting gameplay-state variants through shared page objects rather than raw locators.
- Direct player/spectator route-entry helpers and concise seeded snapshot builders keep the upcoming gameplay specs readable and manual-step-aligned.

Implementation status note:
- Phase 5 gameplay specs for `UI-013` through `UI-018` were implemented and locally validated in `UI_AUTOMATION_MODE=full`, but they are currently marked skipped in [multiplayer-gameplay.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/multiplayer-gameplay.spec.ts) so the multiplayer phases share one deferred runtime posture until host-browser `RemoteCDP` multiplayer reachability is resolved.
Implementation update:
- [x] [multiplayer-gameplay.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/multiplayer-gameplay.spec.ts) is now re-enabled for end-to-end execution.
- [x] Local full-mode execution passes `UI-013` through `UI-018`.
- [x] `RemoteCDP` full-mode execution also passes `UI-013` through `UI-018` when the browser-visible frontend and backend overrides are supplied for the local host environment.

## Feature: Phase 6 Error and Boundary Automation

Implemented local Phase 6 browser coverage in [tests/e2e/multiplayer-errors.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/e2e/multiplayer-errors.spec.ts).

Implemented additions:
- [x] create-capacity coverage using deterministic backend capacity seeding
- [x] forced-create failure coverage with modal-stability assertions
- [x] join-tab discovery failure coverage using the shared forced `list` failure hook
- [x] landing-page spectate discovery failure coverage using the same forced `list` failure hook
- [x] gameplay refresh failure coverage using the forced `detail` failure hook
- [x] create-flow error persistence fix in [src/App.tsx](/workspaces/ai-tic-tac-toe-lab/src/App.tsx) so create failures remain visible after the follow-on waiting-list refresh

Why:
- Phase 6 requires deterministic UI coverage of capacity and API-error paths without relying on manual backend manipulation or timing-sensitive failures.
- The create-flow error message previously cleared itself during the automatic waiting-list reload, which would have made `UI-019` nondeterministic.

## Requested Change: Single-Player Seed Support for UI-004

`UI-004` currently remains skipped for the player-win portion because the current deterministic minimax CPU may not expose a real UI-playable player-win path.

Requested additions:
- [x] add a frontend-only or test-only hook that can initialize single-player gameplay from a provided `GameState`
- [x] expose a safe automation path to open gameplay with seeded single-player board, move history, current player, and terminal/non-terminal status
- [x] use that support to automate the player-win half of `UI-004` without weakening production CPU behavior

Why:
- The current manual requirement expects coverage of a player-win outcome, but that outcome is not guaranteed to be reachable through the live UI against the shipped deterministic CPU. A seeded single-player automation path would make the scenario deterministic without changing real gameplay behavior.

Implementation status note:
- `src/App.tsx` now accepts an explicit single-player seed query parameter for `/game` and hydrates single-player gameplay from that state only when the seed validates successfully.
- `src/shared/game.ts` now validates candidate `GameState` snapshots against reconstructed move history before the app accepts them as seeded single-player state.
- `tests/e2e/single-player-outcomes.spec.ts` now uses the seeded single-player route to cover the player-win and CPU-win halves of `UI-004` in local mode without weakening production CPU behavior.
- `RemoteCDP` re-validation of the updated `UI-004` automation path remains pending.

## Requested Change: Preserve Join Error Visibility for UI-010

`UI-010` now has deterministic automation setup, but the stale-join failure still does not remain visible in the modal long enough to satisfy the UI requirement.

Requested additions:
- [x] keep the join-tab error visible after a failed `POST /games/{id}/join` stale-join response instead of clearing it during the immediate waiting-list refresh
- [x] if discovery is refreshed after a failed join, refresh waiting games without resetting the active modal error first
- [x] re-enable end-to-end automation for `UI-010` after the stale-join error remains observable in the modal

Why:
- The current join failure path sets `multiplayerError`, but the follow-on waiting-game reload clears that value before the UI can reliably expose the error state.
- This is a product-behavior gap, not a missing automation-framework capability.

Implementation status note:
- `src/App.tsx` multiplayer discovery loaders now support refresh paths that preserve an already-visible modal error instead of always clearing it before the waiting-list reconciliation call.
- The stale-join path now refreshes waiting games after a failed join without wiping the visible join error first.
- `tests/e2e/multiplayer-discovery.spec.ts` now runs `UI-010` in local full mode and `RemoteCDP` full mode when the browser-visible frontend and backend overrides are supplied.

## Requested Change: RemoteCDP Host-Browser Multiplayer API Reachability

`RemoteCDP` browser connectivity now works for host Chrome sessions, but the host browser does not yet consume multiplayer create/discovery/detail flows reliably in full-mode runs because the frontend still needs a host-browser-reachable multiplayer API path.

Requested additions:
- [x] resolve the multiplayer API base URL automatically for `RemoteCDP` full-mode runs so the host browser does not fall back to container-local assumptions
- [x] ensure seeded create, discovery, and detail-refresh multiplayer flows remain reachable from the host browser during `RemoteCDP` runs
- [x] re-enable end-to-end `RemoteCDP` coverage for `UI-006`, `UI-007`, `UI-008`, `UI-009`, and `UI-012` after host-browser API reachability is stable

Why:
- Current `RemoteCDP` full-mode failures are no longer CDP connection failures; they are multiplayer-flow failures after the host browser reaches the frontend.
- This is a runtime/API reachability gap specific to host-browser execution rather than a Playwright fixture gap.

Implementation status note:
- `tests/playwright/runtime.ts` now accepts and applies explicit host-browser origin overrides for both the frontend app and multiplayer API in `RemoteCDP` full mode.
- `tests/e2e/support/app-url.ts` now retries browser-visible app origins for `RemoteCDP` navigation so host-browser startup can accommodate local-environment forwarding differences.
- In the current local host environment, the working `RemoteCDP` full-mode override pair is:
  - `UI_AUTOMATION_BASE_URL=http://localhost:4173/`
  - `UI_AUTOMATION_MULTIPLAYER_API_BASE_URL=http://localhost:3001`
- With those overrides, `RemoteCDP` full-mode execution now passes `UI-006`, `UI-007`, `UI-008`, `UI-009`, `UI-010`, `UI-011`, `UI-012`, and `UI-013` through `UI-018`.

## Requested Change: Restore UI-011 Live Spectator Coverage

`UI-011` was intentionally deferred until spectator-mode gameplay automation and `RemoteCDP` multiplayer reachability were both stable enough to prove the live update path end to end.

Requested additions:
- [x] restore the skipped `UI-011` discovery test
- [x] assert that the dedicated landing-page `Spectate` flow reaches read-only spectator gameplay for an active match
- [x] assert that a live player move updates the spectator board and turn messaging without a manual refresh

Why:
- The manual suite requires dedicated landing-page spectator entry plus real-time spectator updates during an active match.
- Placeholder discovery coverage was no longer sufficient once the runtime blockers were removed.

Implementation status note:
- `tests/e2e/multiplayer-discovery.spec.ts` now executes `UI-011` end to end by creating a live match, entering spectator gameplay from the landing-page `Spectate` flow, and asserting that a subsequent host move appears in the spectator session without using `Refresh Match`.
- Local full-mode and `RemoteCDP` full-mode validation both pass for `UI-011` with the same explicit host-browser override pair used for the restored multiplayer runtime coverage.

## Phase 7 Cleanup Update

- Manual-case automation coverage now exists for `UI-001` through `UI-020`.
- The remaining automation work is not new functional coverage; it is cleanup and parity work.
- Cleanup now completed in code for the two known suite-debt items:
  - [x] removed redundant legacy `tests/e2e/spectate.spec.ts` proof coverage because the maintained discovery and spectator-flow suite already covers the same product area through shared fixtures, page objects, and `StepAsync`
  - [x] removed the stale `RemoteCDP` skip from `tests/e2e/multiplayer-errors.spec.ts` so `UI-019` and `UI-020` can run in `RemoteCDP` full mode
- Local verification update:
  - [x] `npm run typecheck`
  - [x] local `UI_AUTOMATION_MODE=full npx playwright test tests/e2e/multiplayer-errors.spec.ts --reporter=list`
- Maintained e2e spec hygiene update:
  - [x] no remaining raw `getBy...` or `locator(...)` calls exist in maintained `tests/e2e/*.spec.ts` files outside the shared page-object layer
- Remaining follow-up is verification parity rather than framework cleanup:
  - [x] validate `UI-019` and `UI-020` in `RemoteCDP` full mode with the documented host-browser overrides
  - setup note: before running the Phase 6 error suite in `RemoteCDP` full mode, confirm the dedicated host Chrome session can already load `http://localhost:4173/` and `http://localhost:3001/health`; when the host browser cannot reach those forwarded localhost ports yet, the suite can fail at initial navigation before the intended error-state assertions run

## Phase 8 Progress: JUnit Step Metadata Foundation

- Added custom JUnit reporter at [tests/playwright/reporters/junit-with-steps.ts](/workspaces/ai-tic-tac-toe-lab/tests/playwright/reporters/junit-with-steps.ts).
- Updated [playwright.config.ts](/workspaces/ai-tic-tac-toe-lab/playwright.config.ts) to keep console `list` output while replacing the stock JUnit reporter with the custom reporter at the same output path: `test-results/playwright/junit.xml`.
- The custom reporter records only Playwright `test.step` events, which in this repo are emitted by the shared `StepAsync` wrapper, and serializes them into one testcase property named `pw:step-metadata`.
- Serialized step payloads are written in execution order and currently include:
  - `index`
  - `name`
  - `status`
  - `durationMs`
  - optional `errorSummary`
- Local verification completed:
  - [x] `npm run typecheck`
  - [x] `UI_AUTOMATION_MODE=frontend npx playwright test tests/e2e/single-player-core.spec.ts --project=chromium`
  - [x] confirmed `pw:step-metadata` properties are present in `test-results/playwright/junit.xml`
  - [x] confirmed failed `StepAsync` steps remain attached to the parent testcase, keep normal testcase-level failure output, and preserve screenshot/error-context attachments
  - [x] confirmed duplicate step titles remain distinguishable through ordered `index` values in the serialized step payload

## Phase 9 Progress: HTML Report Helper Groundwork

- Added Phase 9 helper module at [playwright-html-report.ts](/workspaces/ai-tic-tac-toe-lab/scripts/test/playwright-html-report.ts).
- Added shared artifact-path constants at [playwright-report-paths.ts](/workspaces/ai-tic-tac-toe-lab/scripts/test/playwright-report-paths.ts).
- The helper currently:
  - reads the final Playwright JUnit artifact from `test-results/playwright/junit.xml`
  - parses standard JUnit suite/testcase data plus the embedded `pw:step-metadata` payload
  - normalizes the parsed data into a report model that preserves summary totals, testcase status, fixture-name inference, durations, timestamps, and step-level error summaries
  - reserves `test-results/playwright/report.html` as the stable paired HTML artifact path for later standalone rendering
- Added repo command `npm run test:ui:report` so the helper is runnable as a stable post-automation entrypoint without expanding the compiled AWS script surface.
- Parser implementation note:
  - the helper reuses the existing repo `jsdom` dependency for XML parsing instead of adding a new parser package
  - malformed XML now fails explicitly through parser-error detection instead of producing a partial report model
- Added targeted unit coverage at [playwright-html-report.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/unit/playwright-html-report.spec.ts) for:
  - passed, failed, and skipped testcase parsing
  - failed-step `errorSummary` parsing from `pw:step-metadata`
  - fixture-name inference from testcase metadata
  - CLI option parsing for default and override artifact paths
  - malformed XML and invalid step-payload rejection
- Verification completed:
  - [x] `npm run test:ui:report`
  - [x] `npx playwright test tests/unit/playwright-html-report.spec.ts`
  - [x] confirmed a real failing `StepAsync` run emits testcase `<failure>` plus failed-step `errorSummary`, and the helper consumes both correctly
- Remaining Phase 9 work stays open:
  - [x] confirmed `errorSummary` is stored as concise ANSI-free first-line context rather than the full failure body
  - [x] confirmed the enriched `test-results/playwright/junit.xml` parses as well-formed XML and preserves Playwright's standard `testsuite`/`testcase` structure while storing step metadata only under testcase properties
- Planning note:
  - the remaining user-facing HTML artifact work was split into a dedicated Phase 10 implementation pass so Phase 9 remained the parser/helper groundwork milestone
- CI consumption note:
  - the checked-in PR workflow in `.github/workflows/pr.yml` currently runs `npm test` and `npm run build` only; it does not upload or parse `test-results/playwright/junit.xml`
  - because of that, current consumability verification is structural: preserving the stock JUnit shape and validating that the generated XML parses cleanly while ordinary JUnit readers can ignore the custom `pw:step-metadata` property

## Phase 10 Progress: Standalone HTML Report Rendering

- The repo-local helper in [playwright-html-report.ts](/workspaces/ai-tic-tac-toe-lab/scripts/test/playwright-html-report.ts) now renders and writes a standalone HTML report to `test-results/playwright/report.html` by default.
- The generated HTML report currently includes:
  - `Test Report - Tic Tac Toe` header
  - run summary fields for run identifier, time run started, branch name, total tests, passed, failed, and skipped
  - a self-contained passed/failed/skipped summary chart
  - one result row per testcase with test name, inferred fixture name, status, time of test execution, and expandable artifacts content
  - nested `File Artifacts` and `Steps (# steps executed)` sections inside the artifacts cell
  - step tables populated from embedded `pw:step-metadata`, including concise failed-step `errorSummary` text
- Metadata resolution now prefers CI environment variables for branch and run identifier display and falls back to local git branch resolution when CI branch metadata is unavailable.
- The HTML output remains self-contained and requires no live server to view after generation.
- Added targeted unit coverage at [playwright-html-report.spec.ts](/workspaces/ai-tic-tac-toe-lab/tests/unit/playwright-html-report.spec.ts) for:
  - branch and run metadata resolution
  - HTML rendering structure and escaping
  - file-based JUnit read plus HTML write roundtrip coverage for passed, failed, and skipped cases
  - failed-step `errorSummary` rendering in the generated steps table
  - graceful missing-metadata behavior when branch name or run identifier cannot be determined
- Verification completed:
  - [x] `npm run typecheck`
  - [x] `npx playwright test tests/unit/playwright-html-report.spec.ts --reporter=list`
  - [x] repo-local helper execution against a representative JUnit input containing passed, failed, and skipped tests
