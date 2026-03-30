# Testing Strategy

## File Index

This file describes the project's current automated testing approach.
It identifies the unit and end-to-end test frameworks in use.
It includes the main commands for running current test suites.
It records the most important testing priorities for gameplay and deployment.
It also captures repeat-game regression coverage expectations.

## Content

Date: 2026-03-19
Update: 2026-03-30 20:31:29 UTC - Phase 3 adds coverage reporting and spectator-flow coverage expectations.
Update: 2026-03-30 21:30:09 UTC - Added server test coverage for active-game discovery, late spectator catch-up, and read-only spectator subscriptions.
Update: 2026-03-30 22:32:33 UTC - Added server tests for completed-game exclusion from active spectator lists, missing-game spectator transport errors, and turn-order stability during spectator subscriptions.
Update: 2026-03-30 22:41:06 UTC - Added client unit coverage for the landing-page spectator dialog and the read-only spectator game view with player names.
Update: 2026-03-30 22:46:46 UTC - Clarified the current project-wide test commands and documented that coverage is not yet produced by a single existing command.

Current:
- Unit tests via Vitest: `npm run test:run`
- End-to-end tests via Playwright: `npx playwright test tests/e2e/full-game.spec.ts`
- Multiplayer server unit + flow tests via Vitest (including WebSocket updates): `npm run test:run`
- Coverage reporting is now in scope and should be invokable from the terminal.

Command Notes:
- There is currently no single existing npm command that runs every automated test suite in the project.
- To run the currently documented automated suites, use both:
  - `npm run test:run` - all Vitest tests (in `src/__tests__`)
  - `npm run test:e2e` - all Playwright tests thru the browser
- Coverage is not currently reported by the same existing command, because the repository does not yet define a dedicated coverage script in `package.json`.
- When coverage support is implemented, document the exact terminal command here and note whether it is combined with the full test run or separate from it.

Priorities:
- Validate game logic and board interactions.
- Smoke test UI views after major styling changes.
- Validate deployment by checking the S3 website URL returns the built app after sync.
- Cover repeat gameplay flows in Playwright, including rematch scenarios that should retrigger win effects.
- Cover spectator flows, including listing active games, joining a live game feed, and rendering player-name status in the spectator view.
