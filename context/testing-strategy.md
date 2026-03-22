# Testing Strategy (Draft)
Date: 2026-02-05

## Requirements
- Unit tests for core Game module behaviors: state, moves, turns, win detection.
- Playwright E2E: scripts cover full games for both a winning and losing condition.
- Tests runnable from CLI and CI-automatable.
- UI must be fully automation-testable (selectors, keyboard support where relevant).

## Open Questions
- Code coverage targets?
- E2E environments (local only vs CI pipeline config)?

## Updates
- 2026-02-12: Added a Playwright-based deployment acceptance test pattern for Terraform lifecycle verification (`plan` -> `apply` -> HTTP checks -> `destroy`) using environment-gated inputs for AWS-backed checks.
- 2026-03-08: Added Playwright configuration scaffold (`playwright.config.ts`), runner script, POM base class, and completed Playwright install.
- 2026-03-15: Added a runnable unit-test baseline for pure game/session logic using the Node.js built-in test runner with TypeScript compilation via `tsconfig.unit.json` and `npm run test:unit`.
- 2026-03-17: Added Vitest unit coverage for CPU decision logic in `src/game.test.ts`, including immediate win, immediate block, heuristic priority order, deterministic tie-breaking, and terminal-state handling.
- 2026-03-17: Unit-test execution baseline is `npm run test`.
- 2026-03-20: Playwright UI/API runs and unit-test runs now emit timestamped report logs under `reports/` using `ui-`, `api-`, and `unit-` prefixes, with Playwright HTML artifacts stored under matching timestamped directories.
- 2026-03-22: Default Playwright UI target URL changed to `https://dh0s8gqynjyz6.cloudfront.net`; local UI runs now require `PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173` and only start the local Vite web server when a localhost base URL is selected.
