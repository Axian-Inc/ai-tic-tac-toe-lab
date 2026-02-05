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
