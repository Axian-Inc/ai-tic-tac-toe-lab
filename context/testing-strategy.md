# Testing Strategy

Last updated: 2026-04-13

## Purpose
- Define the baseline test framework for fast unit-test coverage and browser-level UI automation.

## Test Layers
- The default repo-root unit-test workflow uses Playwright against `tests/unit/`.
- Repo-root unit coverage is collected from Node V8 output and reported through Istanbul reporters.
- Existing logic and deployment helper suites have been migrated into the Playwright runner so one unit-test stack covers the repo-default automated test path.
- Browser automation uses Playwright with a Chromium project against the local Vite app.
- Playwright also supports runner-managed unit specs under `tests/unit/` for targeted non-DOM logic coverage when explicitly requested.
- Playwright browser specs now use a shared fixture layer with page objects for landing, gameplay, and multiplayer modal flows.
- Playwright browser specs now wrap manual-style actions with a `StepAsync` helper so step names appear in runner output and failed steps capture screenshots as attachments.
- Full-mode Playwright browser runs now serialize workers against the shared in-memory multiplayer backend so deterministic backend-state reset/seed hooks remain safe without per-worker backend instances.

## Current Priorities
- Cover `src/game/` logic with deterministic unit tests.
- Add targeted React rendering tests for high-risk app-shell flows when a story changes route-entry behavior without introducing backend rule changes.
- Keep Playwright focused on critical user flows such as app launch, route transition, and core gameplay interaction.
- Use Playwright unit specs selectively for isolated logic that benefits from sharing the existing Playwright workflow.
- Prefer stable selectors via `data-testid` for automation-critical controls and board cells.

## Commands
- `npm test` runs Playwright unit specs with coverage.
- `npm run test:watch` runs Vitest in watch mode for local development.
- `npm run test:ui` runs Playwright headless for `tests/e2e/`.
- `npm run test:ui:report` runs the repo-local report helper against the final Playwright JUnit artifact and writes the paired standalone HTML artifact to `test-results/playwright/report.html`.
- `npm run test:ui:full` runs Playwright headless for `tests/e2e/` with both frontend and backend startup.
- `npm run test:unit` runs Playwright headless for `tests/unit/`.
- `npm run test:ui:headed` runs Playwright headed for local debugging.
- `npm run test:ui:headed:full` runs Playwright headed for `tests/e2e/` with both frontend and backend startup.

## Notes
- `npm test` prints coverage in the terminal and writes the stable coverage artifact directory to `coverage/`.
- The current coverage wrapper reports on Playwright-executed project files under `src/`, `server/`, and `scripts/`.
- The former spectate jsdom test has been replaced by Playwright browser coverage in `tests/e2e/spectate.spec.ts`.
- The former legacy spectate proof spec has been retired; maintained spectator coverage now runs through the Phase 4 and Phase 5 Playwright suites (`tests/e2e/multiplayer-modal.spec.ts`, `tests/e2e/multiplayer-discovery.spec.ts`, and `tests/e2e/multiplayer-gameplay.spec.ts`) using the shared fixture and page-object layer.
- Playwright now emits JUnit XML to `test-results/playwright/junit.xml` through a repo-local custom reporter that preserves the existing one-test-per-manual-case structure while adding per-test serialized `StepAsync` metadata under testcase properties.
- UI report artifacts remain paired under `test-results/playwright/`: Playwright writes `junit.xml`, and the repo-local helper reads that final JUnit file and writes `report.html` as the richer standalone artifact without changing the JUnit contract consumed by standard tooling.
- Playwright starts the local Vite dev server automatically through `playwright.config.ts`.
- Playwright supports two browser automation runtime modes through `UI_AUTOMATION_MODE`:
  - `frontend` starts only the Vite app.
  - `full` starts the Vite app plus an automation-only backend server command with test-support endpoints enabled through `AUTOMATION_TEST_SUPPORT=1`.
- `RemoteCDP` host-browser runs require a Chrome instance that is already started with remote debugging enabled and reachable through the configured CDP endpoint.
- `RemoteCDP` host-browser runs may also require explicit browser-visible origin overrides in local dev-container environments:
  - `UI_AUTOMATION_BASE_URL=http://localhost:4173/`
  - `UI_AUTOMATION_MULTIPLAYER_API_BASE_URL=http://localhost:3001`
- Playwright test discovery now spans `tests/`, including `tests/e2e/` and `tests/unit/`.
- Browser automation fixtures now expose a `TestSupportApi` helper for backend reset, snapshot seeding, capacity seeding, and deterministic forced-failure setup during multiplayer UI tests.
- Pull request CI validation uses the same repo-root commands documented for local use: `npm test` for automated unit coverage and `npm run build` for build validation.
