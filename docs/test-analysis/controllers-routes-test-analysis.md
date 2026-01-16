# Controllers/Routes Test Analysis

## Module Overview
Files:
- `src/backend/app.ts` (Fastify app + routes)
- `src/backend/handler.ts` (Lambda adapter)

Routes:
- `POST /v1/new-game`
- `POST /v1/move`

## Test Coverage Summary (From ./coverage)
- `src/backend/app.ts`: Lines 88.70% (102/115), Branches 71.43% (10/14), Functions 100% (3/3)
- `src/backend/handler.ts`: Lines 0% (0/10), Branches 0% (0/1), Functions 0% (0/1)

Tests located:
- `src/backend/__tests__/api.test.ts` (Fastify inject integration-style tests)

## Missing Coverage
- `src/backend/app.ts`:
  - `/v1/new-game` invalid payloads (missing/invalid `startingPlayer`, empty `opponentId`).
  - `/v1/move` invalid payloads beyond empty body (e.g., missing `playerMoveIndex`, malformed `state`).
  - Error mapping for `AI_INVALID_OUTPUT` (502), `AI_TIMEOUT` (504), `AI_UNAVAILABLE` (503), and default 400 branch in `statusForErrorCode`.
  - Error payload structure for move errors beyond `INVALID_MOVE` and `TERMINAL_STATE` (e.g., `INCONSISTENT_STATE`, `INVALID_INPUT`).
  - CORS enable/disable behavior (when `enableCors` is false in handler).
- `src/backend/handler.ts`:
  - No tests verifying Lambda adapter wiring or `LOG_LEVEL` env usage.

## Test Quality Findings
- Tests are readable and deterministic (AI service stub), with schema validation on responses.
- Assertions in the move test are minimal; they validate counts but not full response semantics (e.g., `aiRationale`, board positions, or status correctness).
- Error tests validate `errorCode` but not `message` or `details` shape.

## Edge Cases Not Covered
- New-game requests with `startingPlayer: 'O'` and corresponding state validation behavior.
- Move requests where the game is already terminal but with inconsistent winner/board (should be schema-validated).
- Very large payloads or extra/unknown keys in request bodies (Fastify + schema behavior).
- Non-JSON payloads or invalid JSON bodies.

## Risk Assessment
- High: Status-code mapping for AI failures is untested; regression could silently change HTTP semantics in production.
- Medium: Lambda handler wiring is untested; misconfiguration (e.g., CORS disablement or logger level) could break deployment behavior.
- Medium: `/v1/new-game` error handling is untested; invalid requests may return incorrect error shape.
- Low: Minor response fields (e.g., `aiRationale`) may regress without detection.

## Recommendations (Prioritized)
1. Add integration tests for `/v1/new-game` invalid payloads and verify `INVALID_INPUT` response shape.
2. Add tests that force `gameService.applyPlayerMove` to return AI error codes and verify status mapping (502/504/503).
3. Add a minimal test for `handler.ts` to assert adapter creation and environment-based logger level.
4. Expand move response assertions to include `aiRationale` and board state correctness.

## Example Test Scenarios (No Implementations)
- POST `/v1/new-game` with `{}` → 400 + `INVALID_INPUT` error response schema.
- POST `/v1/move` with malformed `state` (wrong board length) → 400 + `INVALID_INPUT`.
- POST `/v1/move` where AI service returns `AI_TIMEOUT` → 504 + `AI_TIMEOUT`.
- POST `/v1/move` where AI service returns `AI_UNAVAILABLE` → 503 + `AI_UNAVAILABLE`.
- Verify `handler` uses `LOG_LEVEL` env and disables CORS (if observable via app config or response headers).
