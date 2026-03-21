# Testing Strategy

Last updated: 2026-03-21

## Purpose
- Define the baseline test framework for fast game-logic regression coverage and browser-level UI automation.

## Test Layers
- Unit tests use Vitest.
- Unit tests run in a `jsdom` environment so pure logic and React rendering can share one runner as the app grows.
- Browser automation uses Playwright with a Chromium project against the local Vite app.

## Current Priorities
- Cover `src/game/` logic with deterministic unit tests.
- Keep Playwright focused on critical user flows such as app launch, route transition, and core gameplay interaction.
- Prefer stable selectors via `data-testid` for automation-critical controls and board cells.

## Commands
- `npm test` runs Vitest in CI mode with coverage.
- `npm run test:watch` runs Vitest in watch mode for local development.
- `npm run test:ui` runs Playwright headless.
- `npm run test:ui:headed` runs Playwright headed for local debugging.

## Notes
- Vitest coverage is currently scoped to `src/game/**/*.ts` to align with US-19 core-logic goals.
- Playwright starts the local Vite dev server automatically through `playwright.config.ts`.
