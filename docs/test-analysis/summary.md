# Test Coverage Summary (Project)

## High-Risk Gaps
- Lambda handler (`src/backend/handler.ts`) has 0% coverage; adapter wiring and env configuration are unverified.
- External integration behavior (Bedrock, Function URL/CORS) is largely untested in default runs; live tests are opt-in.

## Medium-Risk Gaps
- Branch-level scenarios in `gameService` and `aiMoveService` remain untested (AI error propagation, terminal short-circuit, malformed Bedrock outputs).
- API invalid payload coverage for `/v1/new-game` and `/v1/move` is incomplete.
- CLI and UI state/UX branches (loading, move error handling, selection changes) are under-tested despite high line coverage.

## Low-Risk Gaps
- Formatting helpers and small request builders have lower branch/function coverage but low complexity.

## Strengths
- High line coverage across core logic: `gameService` 84.72%, `aiMoveService` 86.36%, `gameRules` 93.89%.
- Schemas are fully executed in tests (`gameState`, `newGameSchemas`, `moveSchemas` all 100% lines).
- UI tests cover primary flows (new game, move, win highlight) with high line coverage (94.87%).

## Recommended Next Steps (Prioritized)
1. Add targeted tests for `gameService` and `aiMoveService` error/edge branches to close branch coverage gaps.
2. Add API route tests for invalid payloads and AI error-to-status mapping (502/503/504).
3. Add a Lambda adapter test (or harness) to validate request/response mapping and headers.
4. Add UI and CLI tests for loading state, selection controls, and move error handling.
5. Add API client tests for fetch failures and non-OK empty bodies.
