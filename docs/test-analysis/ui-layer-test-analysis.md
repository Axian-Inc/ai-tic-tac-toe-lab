# UI Layer Test Analysis

## Module Overview
Files:
- `src/web/App.tsx` (React UI)
- `src/web/main.tsx` (entry)
- `src/web/App.css`

## Test Coverage Summary (From ./coverage)
- `src/web/App.tsx`: Lines 94.87% (185/195), Branches 83.33% (35/42), Functions 71.43% (5/7)
- `src/web/main.tsx`: Lines 0% (0/10)

Tests located:
- `src/web/__tests__/App.test.tsx`
- `src/web/__tests__/sharedSchemas.test.ts` (schema smoke)

## Missing Coverage (Branch/Scenario-Level)
- Starting player selection and opponent selection changing request payloads.
- Loading state behavior (button disabled, preventing multi-click).
- `client.move` error handling (errors after a move).
- Ignoring clicks when game is terminal or when cell is occupied (early returns).
- Board disabled state (`disabled` attribute reflects state).
- Resetting state on new game after an error (error cleared, rationale cleared).

## Test Quality Findings
- Tests are readable and exercise key user flows, but they focus on happy paths.
- Assertions are limited to text presence; they do not verify that UI state is reset when starting a new game or when errors occur after moves.

## Edge Cases Not Covered
- Starting player set to `O` with backend rule rejecting first move (known issue) and how UI surfaces that error.
- API returns a valid state with `gameStatus: draw` (draw messaging).
- AI rationale absent (should not render rationale panel).

## Risk Assessment
- Medium: UI state transitions around loading/errors could regress without detection.
- Low: Static rendering issues are likely to be caught by existing tests.

## Recommendations (Prioritized)
1. Add tests for selection controls affecting `client.newGame` payload (starting player/opponent).
2. Add tests that verify loading state disables controls and prevents duplicate requests.
3. Add tests for `client.move` failure to ensure error UI and state handling are correct.
4. Add a draw-state test to verify status messaging and cell disabling.

## Example Test Scenarios (No Implementations)
- Change opponent to `defensive`, start new game, assert `client.newGame` called with `opponentId: defensive`.
- Set starting player to `O`, start new game, assert status shows `Next player: O` or error if API rejects.
- `client.move` returns error -> error banner shown and board remains unchanged.
- When `gameStatus` is `draw`, status text is `Draw game.` and board buttons are disabled.
