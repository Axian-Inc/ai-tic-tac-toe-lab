# Testing Strategy

Last updated: 2026-03-28

## Purpose
- Define the baseline test framework for fast game-logic regression coverage and browser-level UI automation.

## Test Layers
- Unit tests use Vitest.
- Unit tests run in a `jsdom` environment so pure logic and React rendering can share one runner as the app grows.
- Browser automation uses Playwright with a Chromium project against the local Vite app.
- Playwright also supports runner-managed unit specs under `tests/unit/` for targeted non-DOM logic coverage when explicitly requested.
- Playwright browser specs now use a shared fixture layer with page objects for landing, gameplay, and multiplayer modal flows.
- Playwright browser specs now wrap manual-style actions with a `StepAsync` helper so step names appear in runner output and failed steps capture screenshots as attachments.

## Current Priorities
- Cover `src/game/` logic with deterministic unit tests.
- Keep Playwright focused on critical user flows such as app launch, route transition, and core gameplay interaction.
- Use Playwright unit specs selectively for isolated logic that benefits from sharing the existing Playwright workflow.
- Prefer stable selectors via `data-testid` for automation-critical controls and board cells.

## Commands
- `npm test` runs Vitest in CI mode with coverage.
- `npm run test:watch` runs Vitest in watch mode for local development.
- `npm run test:ui` runs Playwright headless for `tests/e2e/`.
- `npm run test:ui:full` runs Playwright headless for `tests/e2e/` with both frontend and backend startup.
- `npm run test:unit` runs Playwright headless for `tests/unit/`.
- `npm run test:ui:headed` runs Playwright headed for local debugging.
- `npm run test:ui:headed:full` runs Playwright headed for `tests/e2e/` with both frontend and backend startup.

## Notes
- Vitest coverage is currently scoped to `src/game/**/*.ts` to align with US-19 core-logic goals.
- Playwright now emits JUnit XML to `test-results/playwright/junit.xml`.
- Playwright starts the local Vite dev server automatically through `playwright.config.ts`.
- Playwright supports two browser automation runtime modes through `UI_AUTOMATION_MODE`:
  - `frontend` starts only the Vite app.
  - `full` starts the Vite app plus an automation-only backend server command.
- Playwright test discovery now spans `tests/`, including `tests/e2e/` and `tests/unit/`.
