# Services/Business Logic Test Analysis

## Module Overview
Files:
- `src/backend/services/gameService.ts` (game state transitions + AI orchestration)
- `src/backend/services/aiMoveService.ts` (must-do logic, Bedrock prompting/parsing, retries)
- `src/shared/gameRules.ts` (validation, win/draw detection, move application)

## Test Coverage Summary (From ./coverage)
- `src/backend/services/gameService.ts`: Lines 84.72% (61/72), Branches 64.29% (9/14), Functions 80% (4/5)
- `src/backend/services/aiMoveService.ts`: Lines 86.36% (304/352), Branches 73.21% (41/56), Functions 76.92% (10/13)
- `src/shared/gameRules.ts`: Lines 93.89% (123/131), Branches 91.49% (43/47), Functions 100% (7/7)

Tests located:
- `src/backend/__tests__/aiMoveService.test.ts` (unit-style tests with stubbed Bedrock)
- `src/backend/__tests__/aiMoveService.integration.test.ts` (optional live Bedrock)
- `src/shared/__tests__/gameRules.test.ts` (unit tests)
- Indirect coverage via `src/backend/__tests__/api.test.ts` (exercises `gameService`)

## Missing Coverage (Branch/Scenario-Level)
- `src/backend/services/gameService.ts`:
  - AI error propagation (`AI_TIMEOUT`, `AI_UNAVAILABLE`, `AI_INVALID_OUTPUT`) to `MoveResult`.
  - Unknown opponent profile (`INVALID_INPUT`).
  - AI move rejection path (`INCONSISTENT_STATE` when AI selects illegal move).
  - Early exit when player move ends the game (win/draw) without calling AI.
- `src/backend/services/aiMoveService.ts`:
  - Bedrock timeouts and non-JSON failures mapping to `AI_TIMEOUT` / `AI_UNAVAILABLE`.
  - Behavior when `BEDROCK_MODEL_ID` is missing (throws on construction).
  - Handling of malformed Bedrock payload shape (missing `content[0].text`).
  - Validation of out-of-range or non-integer `moveIndex` from the model.
  - Unknown opponent profile input returns `AI_INVALID_OUTPUT` (no direct test).
- `src/shared/gameRules.ts`:
  - `findWinningLine` (exported) has no direct tests.
  - `computeStatus` lacks explicit `in_progress` case coverage.
  - `validateMove` missing board-count inconsistency checks (e.g., O > X, X > O + 1).
  - `applyMove` error path (invalid move) and win/draw transition checks.

## Test Quality Findings
- `aiMoveService` tests are deterministic and validate retry counts, must-do behavior, and schema strictness.
- `gameRules` tests cover common errors but do not probe boundary/invariant logic (turn-count validation, draw/win edges).
- Integration tests are well-scoped but skipped by default; they do not contribute to CI confidence unless explicitly enabled.

## Edge Cases Not Covered
- AI response with valid JSON but missing `moveIndex` or non-integer values.
- AI response with `rationale` non-string (e.g., null, number).
- Game states with inconsistent `nextPlayer` vs board counts.
- Unknown opponent profile id in `aiMoveService` and `gameService`.

## Risk Assessment
- Medium: `gameService` branch-level paths (AI errors, terminal short-circuit) are not explicitly tested.
- Medium: `aiMoveService` timeout/unavailable error paths are untested; production errors may map incorrectly.
- Low: Prompt construction changes may subtly affect AI behavior without unit coverage.

## Recommendations (Prioritized)
1. Add unit tests for `gameService.applyPlayerMove` covering success, AI errors, terminal-state short-circuit, and AI-invalid-move handling.
2. Add `aiMoveService` tests for timeout and Bedrock failure paths, plus malformed Bedrock payload shapes.
3. Expand `gameRules` tests to include turn-count inconsistency and draw/win transitions in `applyMove`.
4. Add explicit tests for `findWinningLine` and `computeStatus` in-progress scenario.

## Example Test Scenarios (No Implementations)
- `applyPlayerMove` with a player move that wins the game → AI not called, status `win`.
- `applyPlayerMove` when `aiMoveService` returns `AI_TIMEOUT` → propagate error result.
- `aiMoveService` returns `AI_UNAVAILABLE` when Bedrock throws non-JSON, non-timeout error.
- `aiMoveService` rejects model output with `moveIndex: 9` or `moveIndex: 2.5`.
- `validateMove` returns `INCONSISTENT_STATE` when board has more Os than Xs.
