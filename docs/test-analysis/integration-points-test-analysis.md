# Integration Points Test Analysis

## Module Overview
Integration points and external dependencies:
- AWS Bedrock integration via `src/backend/services/aiMoveService.ts`
- Fastify + Lambda adapter via `src/backend/app.ts` and `src/backend/handler.ts`
- HTTP API usage via `src/shared/apiClient.ts` (consumed by web/cli)

## Test Coverage Summary (From ./coverage)
- `src/backend/services/aiMoveService.ts`: Lines 86.36% (304/352), Branches 73.21% (41/56)
- `src/backend/app.ts`: Lines 88.70% (102/115), Branches 71.43% (10/14)
- `src/backend/handler.ts`: Lines 0% (0/10), Branches 0% (0/1)
- `src/shared/apiClient.ts`: Lines 98.25% (112/114), Branches 93.75% (15/16)

Tests located:
- `src/backend/__tests__/aiMoveService.integration.test.ts` (optional live Bedrock)
- `src/backend/__tests__/api.test.ts` (Fastify inject)
- `src/shared/__tests__/apiClient.test.ts` (fetch-mocked)

## Missing Coverage
- Bedrock integration under real network conditions is skipped in CI by default; no minimal smoke is enforced.
- No tests for Bedrock error classes (timeouts, throttling, service errors) at integration level.
- No tests for Lambda adapter behavior (`aws-lambda` request/response mapping, CORS headers).
- No end-to-end flow test from UI/CLI to backend (even with mocks).

## Test Quality Findings
- Integration tests are well-structured but limited to local inject/mocked fetch.
- The live Bedrock tests are opt-in and will not catch regressions in default runs.

## Edge Cases Not Covered
- Function URL/CORS behavior (preflight/headers) and response serialization.
- Bedrock response shapes that differ from expected `content[0].text` structure.
- API client behavior against non-JSON error responses from real infrastructure (e.g., 502 HTML bodies).

## Risk Assessment
- High: External integration regressions (Bedrock/Lambda) may go unnoticed without opt-in tests.
- Medium: CORS or Function URL behavior could break the web UI without detection.
- Medium: Real-world error responses from AWS services are not validated.

## Recommendations (Prioritized)
1. Add a minimal opt-in smoke suite for Bedrock that runs in CI when env vars are set, and document how to enable.
2. Add a Lambda adapter test (or a small harness) to validate request/response mapping and headers.
3. Add an integration test that uses the API client against a locally started Fastify server (no Bedrock calls).

## Example Test Scenarios (No Implementations)
- Invoke Lambda handler with a `/v1/new-game` event payload and assert HTTP 200 JSON response.
- Bedrock returns a throttling error -> service maps to `AI_UNAVAILABLE`.
- API client calls a local server stub and validates real HTTP status/headers.
