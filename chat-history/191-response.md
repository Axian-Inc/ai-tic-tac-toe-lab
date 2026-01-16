# Response
Highlighted the winning line on the board by deriving the winning indices from shared rules and styling those cells to stand out after a win.
- Details: `src/shared/gameRules.ts` now exposes `findWinningLine`, `src/web/App.tsx` applies `board__cell--winning` to winning cells, and `src/web/App.css` styles the highlight even when cells are disabled; `src/web/__tests__/App.test.tsx` covers the win highlight.
- Tests: `npx vitest run src/web/__tests__/App.test.tsx`

Next steps:
1) `npm run dev:web` for a quick visual check.
2) `npm test` to run the full suite.
