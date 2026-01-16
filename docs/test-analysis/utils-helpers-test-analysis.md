# Utils/Helpers Test Analysis

## Module Overview
Files:
- `src/shared/apiClient.ts` (HTTP client + response parsing)
- `src/cli/client.ts` (CLI request builders)
- `src/cli/cli.ts` (arg parsing, IO, formatting helpers)

## Test Coverage Summary (From ./coverage)
- `src/shared/apiClient.ts`: Lines 98.25% (112/114), Branches 93.75% (15/16), Functions 100% (5/5)
- `src/cli/cli.ts`: Lines 71.09% (182/256), Branches 60% (24/40), Functions 83.33% (10/12)
- `src/cli/client.ts`: Lines 96% (24/25), Branches 100% (2/2), Functions 66.67% (2/3)

Tests located:
- `src/shared/__tests__/apiClient.test.ts`
- `src/cli/__tests__/cli.test.ts`
- `src/cli/__tests__/client.test.ts`

## Missing Coverage (Branch/Scenario-Level)
- `src/shared/apiClient.ts`:
  - Fetch/network failures (rejected promise or thrown error).
  - Non-OK responses with empty bodies (non-OK + empty should return INVALID_RESPONSE).
  - `move` rejecting invalid local request payloads (local validation path).
- `src/cli/cli.ts`:
  - Unknown flags, `--help`, or missing flag values (error messaging/usage).
  - Input validation loop in `promptForMove` (non-numeric, out-of-range, occupied cell).
  - `runCli` integration (io close behavior, createCliClient wiring).
  - Formatting helpers (`formatBoard`, `formatStatus`).
- `src/cli/client.ts`:
  - Builders are tested only for happy path; missing function coverage indicates a helper or branch is not exercised.

## Test Quality Findings
- API client tests cover core parsing behavior and base URL normalization.
- CLI tests focus on end-to-end play loop; they do not validate per-branch behavior or error messages.

## Edge Cases Not Covered
- API responses with whitespace-only bodies.
- Server returns 204/empty for OK response (currently treated as INVALID_RESPONSE).
- CLI player prompt when game is already terminal (should not prompt; current loop guard relies on state).

## Risk Assessment
- Medium: CLI UX regressions (arg parsing, prompt loop) may ship silently due to sparse branch coverage.
- Low: API client logic is largely covered, but network failure handling remains untested.

## Recommendations (Prioritized)
1. Add `apiClient` tests for fetch rejection and non-OK empty/invalid bodies.
2. Add CLI tests for `parseArgs` error branches and `promptForMove` validation loop behavior.
3. Add a minimal `runCli` integration test to verify IO closing and usage output.
4. Add small tests for `formatBoard`/`formatStatus` to lock down CLI output.

## Example Test Scenarios (No Implementations)
- `createApiClient.move` with invalid `playerMoveIndex` (local validation) returns `INVALID_INPUT` without fetch.
- `createApiClient.newGame` with fetch rejection returns `INVALID_RESPONSE` (or a new error shape if added).
- `parseArgs` with `--help` returns usage and `INVALID_INPUT` error.
- `promptForMove` rejects `foo`, `9`, and occupied cells before accepting a valid move.
