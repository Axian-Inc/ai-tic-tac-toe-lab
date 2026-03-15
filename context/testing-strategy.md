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
