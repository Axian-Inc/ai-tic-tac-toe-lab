# Current Work
Date: 2026-03-17

## Purpose
Track the single active Jira ticket and execution state so work is visible and uninterrupted.

## Active Ticket
- Key: TTT-75
- Summary: TTT-64 Playwright landing mark tests fail: landing UI controls missing (placeholder screen)
- Status: IN QA

## Plan
1. Await QA validation for the `TTT-75` selector fix.
2. If QA passes, transition `TTT-75` from `IN QA` to `In Review`.
3. Keep `TTT-20` under observation separately while it remains in `IN QA`.

## Progress Log
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
- Await QA validation on `TTT-75`; if it passes, move it from `IN QA` to `In Review`.
