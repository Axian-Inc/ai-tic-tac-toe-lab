# Models/Data Layer Test Analysis

## Module Overview
Files:
- `src/shared/gameState.ts` (GameState schema)
- `src/shared/newGameSchemas.ts` (new-game request schema)
- `src/shared/moveSchemas.ts` (move request/response/error schemas)

## Test Coverage Summary (From ./coverage)
- `src/shared/gameState.ts`: Lines 100% (39/39), Branches 100% (5/5)
- `src/shared/newGameSchemas.ts`: Lines 100% (10/10), Branches 100% (0/0)
- `src/shared/moveSchemas.ts`: Lines 100% (23/23), Branches 100% (0/0)

Tests located:
- `src/shared/__tests__/gameState.test.ts`
- `src/shared/__tests__/newGameSchemas.test.ts`
- `src/shared/__tests__/moveSchemas.test.ts`
- Redundant schema smoke tests in `src/backend/__tests__/sharedSchemas.test.ts`, `src/web/__tests__/sharedSchemas.test.ts`, `src/cli/__tests__/client.test.ts`

## Coverage Notes
- These schema files are fully executed in tests, but full line coverage does not guarantee all semantic invariants are validated (some invariants are not encoded in the schemas).

## Semantic Gaps (Schema-Level)
- `GameStateSchema` does not assert board counts, `nextPlayer` alignment, or that a winning line exists when `gameStatus` is `win`.
- `GameStateSchema` does not enforce that `draw` implies a full board.
- `NewGameRequestSchema` accepts any non-empty `opponentId` string (no enumeration).

## Test Quality Findings
- Tests are clear and cover required fields and winner/status constraints.
- Some tests are redundant across layers (backend/web/cli) and mostly verify schema wiring rather than new behavior.

## Risk Assessment
- Medium: Schema-level gaps allow inconsistent state shapes to pass validation if upstream logic regresses.
- Low: Basic type/shape regressions are likely to be caught by existing tests.

## Recommendations (Prioritized)
1. Add targeted tests (or schema refinements) for invariants: board counts, win/draw consistency, and `nextPlayer` alignment.
2. Consider reducing redundant schema smoke tests across backend/web/cli or replacing them with higher-value behavior tests.

## Example Test Scenarios (No Implementations)
- Attempt to parse a win state with no winning line (expect rejection if invariant is added).
- Attempt to parse a draw state with a `null` cell (expect rejection if invariant is added).
