# Current Work
Date: 2026-03-17

## Purpose
Track the single active Jira ticket and execution state so work is visible and uninterrupted.

## Active Ticket
- Key: TTT-79
- Summary: Selecting X and starting a game can leave the landing screen visible instead of showing the board
- Status: IN QA

## Plan
1. Add explicit board sizing in `src/App.tsx` so the 3x3 grid and squares cannot collapse to zero-size after game start.
2. Validate the fix with `npm run lint`, `npm run build`, and a Playwright probe against the deployed gameplay-start flow.
3. Add implementation evidence to Jira and transition `TTT-79` to `IN QA` when the fix is complete.

## Progress Log
- 2026-03-17 22:47 UTC - Updated `src/App.tsx` to give the game board an explicit responsive width (`w-full max-w-md sm:max-w-lg`) and make each square fill its grid track (`w-full aspect-square`), preventing zero-size cells after game start.
- 2026-03-17 22:47 UTC - Validation passed for `TTT-79`: `npm run lint`, `npm run build`, and `npm run format:check`.
- 2026-03-17 22:47 UTC - Local Playwright repro against the previewed app confirmed the fix: board grid measured about `512x512` and the first square about `162.66x162.66`, with `Round 1`, `player-mark = X`, and `cpu-mark = O` visible after start.
- 2026-03-17 22:47 UTC - Added Jira implementation evidence comment to `TTT-79`.
- 2026-03-17 22:47 UTC - Transitioned Jira ticket `TTT-79` from `In Progress` to `IN QA`.
- 2026-03-17 22:49 UTC - Deployed the `TTT-79` fix to `https://dh0s8gqynjyz6.cloudfront.net` via `aws s3 sync dist s3://ttt-static-6e555da9 --delete` and CloudFront invalidation `I8T5OMWFUJUSTT3BDNR0IJB7FA`.
- 2026-03-17 22:49 UTC - Verified the deployed site with `curl -I` (`HTTP/2 200`, `Last-Modified: Tue, 17 Mar 2026 22:49:04 GMT`) and a Playwright repro confirming a visible `512x512` board with visible square cells after `Play as X` -> `Play vs CPU`.
- 2026-03-17 18:05 UTC - Transitioned Jira ticket `TTT-21` from `Groomed` to `In Progress` and made it the active delivery ticket.
- 2026-03-17 18:05 UTC - Paused active tracking on `TTT-75`; it remains in `IN QA` awaiting QA validation while `TTT-21` is being implemented.
- 2026-03-17 18:09 UTC - Implemented the groomed CPU heuristic in `src/game.ts`: immediate win, immediate block, center, opposite corner, empty corner, then empty edge, with deterministic lowest-index tie-breaking within each priority.
- 2026-03-17 18:09 UTC - Added Vitest-based CPU unit coverage in `src/game.test.ts` and wired `npm run test` into the repository scripts.
- 2026-03-17 18:09 UTC - Validation passed for `TTT-21`: `npm run test`, `npm run lint`, `npm run build`, and `npm run format:check`.
- 2026-03-17 18:10 UTC - Added Jira implementation evidence comment to `TTT-21`.
- 2026-03-17 18:10 UTC - Transitioned Jira ticket `TTT-21` from `In Progress` to `IN QA`.
- 2026-03-17 18:18 UTC - Rebuilt the app for deployment and uploaded `dist/` to `s3://ttt-static-6e555da9` using `aws s3 sync dist s3://ttt-static-6e555da9 --delete`.
- 2026-03-17 18:18 UTC - Created CloudFront invalidation `IBC8DG2N5854COCEVQJHSHLZ2F` for distribution `EGW5O3MVJM73U`.
- 2026-03-17 18:18 UTC - Verified the deployed site at `https://dh0s8gqynjyz6.cloudfront.net`; `curl -I` returned `HTTP/2 200` with `Last-Modified: Tue, 17 Mar 2026 18:18:17 GMT`.
- 2026-03-17 22:46 UTC - Transitioned Jira bug `TTT-79` from `To Do` to `In Progress` after Playwright confirmed the game state starts but the board layout collapses visually.
- 2026-03-17 22:46 UTC - Paused active tracking on `TTT-21`; it remains in `IN QA` awaiting QA validation while the `TTT-79` layout fix is implemented.
- 2026-03-17 17:24 UTC - Reviewed `TTT-75`, confirmed the original placeholder-screen diagnosis is stale, and identified the real remaining gap: missing `player-mark` / `cpu-mark` selectors in the started-game view.
- 2026-03-17 17:24 UTC - Transitioned Jira ticket `TTT-75` from `To Do` to `In Progress`.
- 2026-03-17 17:25 UTC - Added explicit post-start mark display elements in `src/App.tsx` with `data-testid=\"player-mark\"` and `data-testid=\"cpu-mark\"`.
- 2026-03-17 17:25 UTC - Validation passed: `npm run lint`, `npm run build`, and `npm run format:check`.
- 2026-03-17 17:25 UTC - Added implementation evidence comment on Jira issue `TTT-75`.
- 2026-03-17 17:25 UTC - Transitioned Jira ticket `TTT-75` from `In Progress` to `IN QA`.
- 2026-03-17 17:30 UTC - Rebuilt the app for deployment and uploaded `dist/` to `s3://ttt-static-6e555da9` using `aws s3 sync dist s3://ttt-static-6e555da9 --delete`.
- 2026-03-17 17:30 UTC - Created CloudFront invalidation `I7O5ABFVF1AZNI8A8NSNCDDG77` for distribution `EGW5O3MVJM73U`.
- 2026-03-17 17:30 UTC - Verified the deployed site at `https://dh0s8gqynjyz6.cloudfront.net`; `curl -I` returned `HTTP/2 200` with `Last-Modified: Tue, 17 Mar 2026 17:30:24 GMT`.
- 2026-03-17 15:59 UTC - Reviewed context, inspected the current dirty worktree, and confirmed the UI regression path in `src/App.tsx` / `src/game.ts`.
- 2026-03-17 15:59 UTC - Reopened Jira ticket `TTT-20` from `IN QA` to `In Progress` to correct the broken implementation.
- 2026-03-17 16:01 UTC - Fixed the game module/UI regression set: corrected CPU-opening turn state, added move-history tracking, restored deterministic CPU turns, and fixed `Quit to landing`.
- 2026-03-17 16:01 UTC - Refreshed local dependencies with `npm install`, restoring the missing Linux Rollup package in `node_modules`.
- 2026-03-17 16:01 UTC - Validation passed: `npx tsc -b`, `npm run lint`, `npm run build`, and `npm run format:check`.
- 2026-03-17 16:01 UTC - Added implementation evidence comment on Jira issue `TTT-20`.
- 2026-03-17 16:01 UTC - Transitioned Jira ticket `TTT-20` from `In Progress` back to `IN QA`.
- 2026-03-17 16:42 UTC - Rebuilt the app for deployment and uploaded `dist/` to `s3://ttt-static-6e555da9` using `aws s3 sync dist s3://ttt-static-6e555da9 --delete`.
- 2026-03-17 16:42 UTC - Created CloudFront invalidation `IC5N8DZFX17IWUW2VIG870488A` for distribution `EGW5O3MVJM73U`.
- 2026-03-17 16:43 UTC - Verified the deployed site at `https://dh0s8gqynjyz6.cloudfront.net`; `curl -I` returned `HTTP/2 200` with `Last-Modified: Tue, 17 Mar 2026 16:42:51 GMT`.
- 2026-03-13 11:00 - Transitioned TTT-19 from IN QA to In Review (implementation complete).
- 2026-03-13 11:00 - Transitioned TTT-20 from To Do to In Progress and initialized implementation tracking.
- 2026-03-13 11:30 - Completed game module implementation (TTT-20).
- 2026-03-13 12:00 - Validation passed (format, lint, build).
- 2026-03-13 12:08 - Added implementation evidence comment on Jira issue TTT-20.
- 2026-03-13 12:09 - Transitioned TTT-20 from In Progress to IN QA.

## Blockers/Risks
- None.

## Next Action
- Await QA validation on `TTT-79`; if it passes, transition it from `IN QA` to `In Review`.
