# Response

Captured a test-first strategy aligned with project context in `context/testing-strategy.md`, covering categories, exclusions, and backend/frontend guidance.

- Test-first flow: start from stories/acceptance, write smallest failing test with deterministic fixtures, implement, refactor.
- Categories: unit (game rules, zod schemas, prompt builder/parser), integration (API endpoints + AI adapter with LLM stubs), AI behavior (legal-move and must-do scenarios per opponent).
- Not auto-tested: LLM creativity/rationale quality, subjective UI aesthetics, live Bedrock reliability/latency, full E2E with live LLM in CI.
- Backend: `vitest`, mock Bedrock client, contract/error-shape tests, stateless consistency checks.
- Frontend: `@testing-library/react` + `vitest`, behavior-focused tests, API mocks, avoid snapshot-only.

Next steps:
1) Identify initial unit fixtures for the game engine and AI parser.
2) Define the must-do AI scenarios per opponent profile.
3) Add minimal integration tests for `/v1/new-game` and `/v1/move`.
