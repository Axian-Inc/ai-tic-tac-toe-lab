# Testing Strategy

## File Index

This file describes the project's current automated testing approach.
It identifies the unit and end-to-end test frameworks in use.
It includes the main commands for running current test suites.
It records the most important testing priorities for gameplay and deployment.
It also captures repeat-game regression coverage expectations.

## Content

Date: 2026-03-19

Current:
- Unit tests via Vitest: `npm run test:run`
- End-to-end tests via Playwright: `npx playwright test tests/e2e/full-game.spec.ts`

Priorities:
- Validate game logic and board interactions.
- Smoke test UI views after major styling changes.
- Validate deployment by checking the S3 website URL returns the built app after sync.
- Cover repeat gameplay flows in Playwright, including rematch scenarios that should retrigger win effects.
