# LD-WorkLog.md

## 2026-03-30 15:36 UTC

- Created `WorkTracker.md` to serve as the markdown work-tracking board for this repository.
- Organized the project into three epics mapped to Phases 1, 2, and 3.
- Planned stories under each epic with title, description, date/time, status, assignment, and comments fields.
- Added review and acceptance gates to the plan so execution can pause after meaningful milestones.

## 2026-03-31 12:47 UTC

- Established the first milestone as an initial git checkpoint.
- Added `.gitignore` to exclude `node_modules/` from version control.
- Prepared the repository state for the first commit named `Initial Setup`.

## 2026-03-31 12:52 UTC

- Started Story `1.1` for the Phase 1 scaffold milestone.
- Chose `Vite + React + TypeScript` as the frontend foundation for fast local boot, simple bundling, and a clean TypeScript setup.
- Added app scripts in `package.json`: `dev`, `build`, `preview`, and `typecheck`.
- Added scaffold/config files: `index.html`, `tsconfig.json`, `vite.config.ts`, and the initial `src/` tree.
- Created the initial source layout under `src/app`, `src/pages`, `src/features/game`, and `src/styles`.
- Built a placeholder app shell and static board preview to confirm the app boots without moving ahead into gameplay implementation.
- Expanded `.gitignore` to exclude `dist/`.
- Re-ran dependency installation serially after an initial parallel install pass so `package.json`, `package-lock.json`, and `node_modules` stayed aligned.
- Verified the milestone with `npm run build`.
- Verified the dev boot path by starting `npm run dev -- --host 127.0.0.1 --port 4173` and confirming an HTTP `200` response from `http://127.0.0.1:4173/`.
- Updated `WorkTracker.md` to move Epic `EPIC-01` to `In Progress` and Story `STORY-1.1` to `In Review`.

## 2026-03-31 13:08 UTC

- Removed the unused `codex` dependency from `package.json`.
- Ran `npm uninstall codex` to synchronize `package-lock.json` and the local dependency tree.
- Re-checked dependency health after the removal and confirmed `npm audit` reports `0 vulnerabilities`.

## 2026-03-31 13:09 UTC

- Story `1.1` was reviewed and accepted by the user.
- Marked Story `1.1` as `Done` in `WorkTracker.md`.
- Recorded that `codex` had been added to the app dependency tree unnecessarily during setup work and was removed once reviewed.
- Preserved the scaffold milestone boundary so future work can start at Story `1.2`.

## 2026-03-31 13:13 UTC

- Started Story `1.2` for the Phase 1 game-domain milestone.
- Added a UI-independent game model under `src/features/game/model/`.
- Implemented pure game-state creation, move application, turn tracking, legal-move validation, winner detection, draw detection, available-move derivation, and move history tracking.
- Implemented deterministic CPU move selection with a stable priority order and immediate win/block checks.
- Updated the existing board preview component to render board state supplied by the game domain rather than hard-coded values.
- Added a read-only domain preview on the scaffold page to show a sample board state and CPU recommendation without moving into Story `1.3` gameplay flow work.
- Corrected the scaffold page copy so it reflects the Story `1.2` milestone rather than the earlier scaffold milestone.
- Verified the milestone with `npm run typecheck` and `npm run build`.
- Updated `WorkTracker.md` to move Story `STORY-1.2` to `In Review`.

## 2026-03-31 13:16 UTC

- Story `1.2` was reviewed and accepted by the user.
- Marked Story `1.2` as `Done` in `WorkTracker.md`.
- Started Story `1.3` for the Phase 1 single-player gameplay-flow milestone.
- Scoped this milestone to landing page, start-game flow, playable game screen, quit action, CPU rematch loop, and game status messaging only.

## 2026-03-31 13:18 UTC

- Replaced the scaffold-only app shell with a two-screen Phase 1 flow: landing page and single-player game page.
- Added a `Play vs. CPU` entry point on the landing page.
- Wired the app to create a fresh game, enter the game screen, and render live status text from the game domain.
- Added CPU turn handling in the app layer using the deterministic move selector from the game model.
- Added playable board input, in-game status pills, game detail summary, quit action, and rematch action.
- Kept the implementation inside Story `1.3` boundaries and deferred richer feedback concerns such as celebration, sound, and advanced move affordances to Story `1.4`.
- Verified the UI milestone with `npm run typecheck` and `npm run build`.
- Ran a game-domain smoke test by compiling the game model to `/tmp` and confirming a deterministic CPU response sequence after player moves.
- Updated `WorkTracker.md` to move Story `STORY-1.3` to `In Review`.

## 2026-03-31 13:25 UTC

- Story `1.3` was reviewed and accepted by the user.
- Marked Story `1.3` as `Done` in `WorkTracker.md`.
- Started Story `1.4` for the Phase 1 feedback-and-celebration milestone.
- Scoped this milestone to move affordances, illegal-move feedback, and lightweight win/loss celebration behavior only.

- Added hover-aware board feedback so the UI distinguishes currently available and unavailable moves.
- Adjusted board interaction so blocked moves still surface feedback instead of failing silently.
- Added in-game feedback messaging for occupied cells, unavailable moves, and finished-game clicks.
- Added lightweight generated audio cues for moves, wins, losses, and draws using the browser audio API.
- Added visual outcome treatment for win, loss, and draw states through banners, board highlighting, and panel emphasis.
- Verified the milestone with `npm run typecheck` and `npm run build`.
- Updated `WorkTracker.md` to move Story `STORY-1.4` to `In Review`.

## 2026-03-31 13:30 UTC

- Story `1.4` was reviewed and accepted by the user.
- Marked Story `1.4` as `Done` in `WorkTracker.md`.
- Started Story `1.5` for the Phase 1 automated-test milestone.
- Scoped this milestone to unit coverage for the game domain and a terminal-runnable Playwright winning-flow test.

- Added `vitest` and `@playwright/test` as dev dependencies.
- Added terminal scripts for unit tests, e2e tests, and the combined test run.
- Added a dedicated `vitest.config.ts` so unit runs only pick up `tests/unit/**`.
- Added unit coverage for game state creation, move legality, winner detection, draw detection, and deterministic CPU behavior.
- Added Playwright configuration that starts the Vite app automatically for browser tests.
- Added an end-to-end Playwright scenario that completes a deterministic player win against the CPU.
- Corrected one unit-test setup bug where the expected CPU winning move was asserted on the wrong turn.
- Corrected the Playwright winning path after brute-forcing a real player-win sequence against the current deterministic CPU logic.
- Installed Playwright Chromium browser binaries and then installed the missing system libraries with `npx playwright install-deps chromium` so browser tests could run in this container.
- Verified the milestone with `npm run test:unit`, `npm run test:e2e`, and `npm test`.
- Updated `WorkTracker.md` to move Story `STORY-1.5` to `In Review`.

## 2026-03-31 13:38 UTC

- Story `1.5` was reviewed and accepted by the user.
- Marked Story `1.5` as `Done` in `WorkTracker.md`.
- Started and completed Story `1.6` for the Phase 1 documentation and deployment-baseline milestone.
- Replaced the starter `README.md` with a project-specific guide covering setup, scripts, testing, architecture, and deployment baseline usage.
- Added `docs/architecture.md` to document the Phase 1 client-only design and runtime flow.
- Added `docs/project-organization.md` to describe the repo structure and ownership of major directories.
- Added `infra/cloudformation/static-site.yml` as a low-cost AWS static-site baseline using S3 website hosting.
- Added `infra/deploy-static-site.sh` to build the app, deploy the CloudFormation stack, and sync the built site to S3.
- Added `infra/README.md` to explain required AWS inputs and the deployment flow.
- Added `npm run deploy:static` and extended `.gitignore` to cover Playwright output artifacts.
- Removed the unnecessary IAM capability flag from the deployment script because the template does not create IAM resources.
- Verified the milestone with `bash -n infra/deploy-static-site.sh` and `npm run build`.
- Updated `WorkTracker.md` to move Story `STORY-1.6` to `In Review`.

## 2026-03-31 13:44 UTC

- Added a new Phase 1 backlog item, Story `1.7`, to cover configurable status-bar modes.
- Wrote the story with four explicit supported values:
  `1 = AsBuilt`, `2 = AlwaysOn`, `3 = Bottom`, `4 = BottomAlwaysOn`.
- Recorded that the current target/default setting for future implementation should be mode `2`.
- Wrote the story text to emphasize a configurable UI state rather than a one-off hard-coded layout tweak.

## 2026-03-31 13:46 UTC

- Expanded Story `1.7` to add a fifth status-bar mode: `5 = InGameDetailCard`.
- Corrected the implementation target so the mode system applies to the larger dynamic game-status panel rather than the compact pill strip.
- Restored the compact summary strip to the hero card.
- Implemented a configurable game-status panel component and mode configuration in the app.
- Changed the active/default status-bar mode from `2` to `5`.
- Updated `README.md`, `docs/architecture.md`, and `docs/project-organization.md` so all five supported values and the current default are documented.
- Updated `WorkTracker.md` to move Story `STORY-1.7` to `In Review`.

## 2026-03-31 13:49 UTC

- This status-bar interaction went badly.
- I misidentified the UI element the user wanted changed and implemented a much broader system than requested.
- That created unnecessary code churn, documentation churn, and avoidable back-and-forth.
- The correct target was the larger changing status area at the top of the game screen, not the compact pill-style summary row.
- The better approach would have been to verify the exact target in the existing UI and make the smallest possible change first.

## 2026-03-31 14:05 UTC

- Reverted the mis-scoped status-mode implementation from the app, styles, and documentation.
- Removed the temporary `GameStatusBar`, `GameStatusPanel`, and `statusBar` configuration files because they were part of the unnecessary expansion.
- Restored the original Phase 1 game layout so the dynamic status messaging is back in the hero card rather than controlled by a new mode system.
- Moved the backlog item out of Phase 1 from `STORY-1.7` to `STORY-4.1`.
- Rewrote the deferred story as a narrow UX adjustment for relocating the larger changing status banner without introducing another configuration system.

## 2026-03-31 14:06 UTC

- Added a durable process note to `AGENTS.md` based on the failed status-bar interaction.
- The lesson is that when taking over another person's requirements, the agent should review the relevant UI first and confirm what the major named components are before changing code.
- A quick shared lexicon review would have prevented the mismatch where `status bar` was interpreted differently than the human intended.
- Story `1.6` was reviewed and accepted by the user.
- Marked Story `1.6` as `Done` in `WorkTracker.md`.
- Closed Epic `EPIC-01` as `Done`, which completes the Phase 1 backlog.

## 2026-03-31 14:18 UTC

- Started Story `2.1` for the Phase 2 architecture-and-contract milestone.
- Re-read the Phase 2 brief and the current Phase 1 implementation to keep this milestone inside the contract boundary and avoid prematurely implementing server behavior.
- Added `shared/contracts/multiplayer.ts` and `shared/contracts/index.ts` as the shared client/server protocol baseline for multiplayer work.
- Defined the Phase 2 constants for max concurrent games and abandonment timeout in the shared contract layer.
- Defined the chosen HTTP payloads, WebSocket event types, opaque identifiers, participant roles, and canonical multiplayer game snapshot shape.
- Added `docs/multiplayer-architecture.md` to document the backend shape, endpoint decisions, WebSocket event design, and project-structure choice for future stories.
- Added `server/README.md` to reserve the backend ownership boundary without implementing the server yet.
- Updated `README.md`, `docs/architecture.md`, and `docs/project-organization.md` so the new contract baseline and repo structure are documented.
- Added `tests/unit/multiplayer-contracts.test.ts` to lock the new constants, endpoint paths, event-type set, and representative payload shapes.
- Updated `WorkTracker.md` to move Epic `EPIC-02` to `In Progress` and Story `STORY-2.1` to `In Review`.
- Story `2.1` was reviewed and accepted by the user.
- Marked Story `2.1` as `Done` in `WorkTracker.md`.
- Added a durable repo rule that accepted stories should be checkpointed with a git commit before moving on, unless the user says otherwise.
- Added `phases/output/` to `.gitignore` so generated review screenshots do not pollute future commits.

## 2026-03-31 14:32 UTC

- Started Story `2.2` for the multiplayer HTTP lifecycle milestone.
- Found a contract gap while implementing the server: with no auth layer, move, resign, and abandonment-check requests need the server-issued `sessionId` to identify the acting participant.
- Updated the shared multiplayer contract and docs so mutation requests include `sessionId`, and create/join responses include the emitted event alongside the full game snapshot.
- Added the in-memory multiplayer server implementation under `server/`, including create, list, join, move, resign, and abandonment-check HTTP routes.
- Kept the transport scope inside Story `2.2` by implementing HTTP only and deferring WebSocket broadcast/catch-up behavior to Story `2.3`.
- Added `npm run dev:server`, `npm run start:server`, and `npm run test:server` so the API is runnable and testable from the terminal.
- Added server integration coverage in `tests/server/multiplayer-api.test.ts`.
- Updated `README.md`, `docs/architecture.md`, `docs/multiplayer-architecture.md`, and `docs/project-organization.md` for the new server surface.
- Updated `WorkTracker.md` to move Story `STORY-2.2` to `In Review`.
- Story `2.2` was reviewed and accepted by the user.
- Marked Story `2.2` as `Done` in `WorkTracker.md`.

## 2026-03-31 14:44 UTC

- Started Story `2.3` for WebSocket broadcast and catch-up support.
- Tightened the multiplayer state model so move history stores the real acceptance timestamp for each move instead of reusing the most recent game update timestamp.
- Added a lightweight event bus to the multiplayer service so live game mutations can be published to transport listeners.
- Added `server/realtime/attachRealtimeServer.ts` to handle `WS /ws?gameId=...` upgrades and send an immediate `game.snapshot` resync event on subscription.
- Kept replay and catch-up simple by using the existing full game snapshot plus ordered move history rather than introducing a second replay endpoint in this milestone.
- Added WebSocket transport coverage in `tests/server/multiplayer-websocket.test.ts`.
- Updated `README.md`, `docs/architecture.md`, `docs/multiplayer-architecture.md`, and `docs/project-organization.md` for the realtime transport path.
- Updated `WorkTracker.md` to move Story `STORY-2.3` to `In Review`.
- Story `2.3` was reviewed and accepted by the user.
- Marked Story `2.3` as `Done` in `WorkTracker.md`.

## 2026-03-31 14:58 UTC

- Started Story `2.4` for the visible multiplayer client milestone.
- Added a Vite dev proxy for `/games` and `/ws` so the browser client can talk to the local multiplayer server during development without hard-coded absolute URLs.
- Added browser-side multiplayer helpers under `src/features/multiplayer/` for HTTP requests, WebSocket subscriptions, and snapshot-to-board mapping.
- Expanded the landing page to expose both single-player and multiplayer entry points.
- Added `MultiplayerLobbyPage.tsx` for create/join waiting-game flows.
- Added `MultiplayerGamePage.tsx` for live server-backed match play and remote move updates.
- Updated `App.tsx` to coordinate single-player, multiplayer lobby, and multiplayer match state while preserving the existing Phase 1 flow.
- Added a two-client Playwright test in `tests/e2e/multiplayer.spec.ts` to prove create, join, and live board synchronization across two browser contexts.
- Corrected two Playwright test issues during implementation: one game-id parsing bug and one overly broad text locator.
- Updated `README.md`, `docs/architecture.md`, and `docs/project-organization.md` for the new multiplayer client surface.
- Updated `WorkTracker.md` to move Story `STORY-2.4` to `In Review`.
- Story `2.4` was reviewed and accepted by the user.
- Marked Story `2.4` as `Done` in `WorkTracker.md`.

## 2026-03-31 15:02 UTC

- Started Story `2.5` for multiplayer server hardening.
- Added enforcement of the `25` concurrent waiting/active game cap in `server/multiplayer/service.ts`.
- Wired the cap to return `429` on `POST /games` once the allowed concurrency threshold is reached.
- Expanded server integration tests to cover the cap, resign-before-join rejection, premature abandonment no-op behavior, invalid abandonment timestamps, and unknown-session rejection.
- Corrected the server test harness so each API test runs against a fresh in-memory service instead of leaking game state across cases.
- Updated `README.md`, `docs/architecture.md`, `docs/multiplayer-architecture.md`, and `docs/project-organization.md` for the hardening milestone.
- Updated `WorkTracker.md` to move Story `STORY-2.5` to `In Review`.
- Story `2.5` was reviewed and accepted by the user.
- Marked Story `2.5` as `Done` in `WorkTracker.md`.

## 2026-03-31 15:06 UTC

- Started Story `2.6` for the Phase 2 close-out package.
- Added `Dockerfile.server` and `.dockerignore` as a deployable packaging baseline for the multiplayer API runtime.
- Added `infra/cloudformation/multiplayer-api.yml` as a low-cost EC2-based multiplayer API infrastructure baseline.
- Added `infra/package-multiplayer-api.sh` to create the multiplayer API artifact tarball used for deployment.
- Added `infra/deploy-multiplayer-api.sh` to upload the artifact to S3 and deploy the API CloudFormation stack.
- Added `npm run package:server` and `npm run deploy:server` so the multiplayer deployment path is callable from package scripts.
- Expanded `infra/README.md`, `README.md`, `docs/architecture.md`, and `docs/project-organization.md` to cover the multiplayer deployment footprint and operational model.
- Verified the artifact packaging path with `npm run package:server`.
- Verified shell syntax with `bash -n infra/deploy-multiplayer-api.sh`, `bash -n infra/package-multiplayer-api.sh`, and `bash -n infra/deploy-static-site.sh`.
- Re-ran `npm run test:server` and `npm run build` to confirm the deployment additions did not regress the Phase 2 app/server behavior.
- Updated `WorkTracker.md` to move Story `STORY-2.6` to `In Review`.
- Story `2.6` was reviewed and accepted by the user.
- Marked Story `2.6` as `Done` in `WorkTracker.md`.
- Closed Epic `EPIC-02` as `Done`, which completes Phase 2.
- Added `.artifacts/` to `.gitignore` so packaged server tarballs do not pollute future commits.

## 2026-03-31 15:18 UTC

- Started Story `3.1` for the Phase 3 spectator-data milestone.
- Added `GET /games/{id}` so a spectator client can fetch the current state snapshot for a selected game before opening a WebSocket.
- Reused the existing `GET /games?status=active` filter as the active-game discovery path for spectator flows.
- Kept the existing WebSocket subscription model unchanged because it already supports selected-game live updates without requiring a player session.
- Expanded server integration coverage to verify active-game discovery and per-game snapshot reads.
- Updated `README.md`, `docs/architecture.md`, `docs/multiplayer-architecture.md`, and `docs/project-organization.md` for the new spectator-oriented server surface.
- Updated `WorkTracker.md` to move Epic `EPIC-03` to `In Progress` and Story `STORY-3.1` to `In Review`.
- Story `2.6` was reviewed and accepted by the user.
- Marked Story `2.6` as `Done` in `WorkTracker.md`.
- Closed Epic `EPIC-02` as `Done`, which completes Phase 2.
- Added `.artifacts/` to `.gitignore` so packaged server tarballs do not pollute future commits.

## 2026-03-31 15:21 UTC

- The user accepted Story `3.1` and directed work to continue.
- Marked Story `3.1` as `Done` in `WorkTracker.md`.
- Preparing a git checkpoint for the accepted server-side spectator-data milestone before starting Story `3.2`.

## 2026-03-31 15:29 UTC

- Created git checkpoint `9a5faee` with message `Phase 3 Story 3.1` after the user accepted Story `3.1`.
- Started Story `3.2` for the browser spectator-flow milestone.
- Added `listActiveGames` and `getMultiplayerGame` to the browser multiplayer API helper so the client can discover and hydrate spectator views.
- Added `src/pages/SpectatorLobbyPage.tsx` for active-game discovery and watch selection.
- Updated `LandingPage.tsx` so the home screen now exposes a `Spectate Live Games` entry point.
- Extended `App.tsx` with spectator-specific screen state, active-game loading, selected-game hydration, and a dedicated live-update connection path for read-only viewers.
- Reused `MultiplayerGamePage.tsx` for spectator viewing by parameterizing the page copy and improving the status messaging for `Observer` mode.
- Expanded `tests/e2e/multiplayer.spec.ts` with a third-browser spectator scenario that verifies a spectator can open an active game and see a live move arrive.
- Found that Playwright initially reused a stale long-running API server on port `8787`, which hid the new `GET /games/{id}` route during the spectator test.
- Updated `vite.config.ts` and `playwright.config.ts` so Playwright now starts an isolated API server on `8788` and points the Vite proxy at that port for reliable end-to-end runs.
- Updated `README.md`, `docs/architecture.md`, `docs/multiplayer-architecture.md`, and `docs/project-organization.md` for the new spectator UI behavior.
- Updated `WorkTracker.md` to move Story `STORY-3.2` to `In Review`.

## 2026-03-31 15:30 UTC

- The user accepted Story `3.2` and directed work to continue.
- Marked Story `3.2` as `Done` in `WorkTracker.md`.
- Preparing a git checkpoint for the accepted spectator UI milestone before starting Story `3.3`.

## 2026-03-31 15:34 UTC

- Created git checkpoint `9910a8a` with message `Phase 3 Story 3.2` after the user accepted Story `3.2`.
- Started Story `3.3` for terminal coverage reporting.
- Added `@vitest/coverage-v8` as a dev dependency so coverage can be generated directly from the existing Vitest stack.
- Added `vitest.coverage.config.ts` to combine the unit and server suites into one coverage run with text, HTML, and JSON-summary outputs.
- Added `npm run coverage` to `package.json` and ignored the generated `coverage/` directory in `.gitignore`.
- Updated `README.md`, `docs/architecture.md`, and `docs/project-organization.md` so the new coverage command and output path are documented.
- Updated `WorkTracker.md` to move Story `STORY-3.3` to `In Review`.

## 2026-03-31 16:00 UTC

- The user accepted Story `3.3`.
- Marked Story `3.3` as `Done` in `WorkTracker.md`.
- Preparing the git checkpoint for the accepted coverage milestone before continuing Phase 3 work.

## 2026-03-31 16:08 UTC

- Began Story `3.4` for the pull request pipeline milestone after the repo push succeeded.
- Removed a duplicate `@vitest/coverage-v8` entry from `package.json` before wiring CI so the workflow starts from a clean dependency manifest.
- Added `.github/workflows/pull-request.yml` to validate install, build, unit tests, server tests, coverage generation, and multiplayer server packaging on pull requests.
- Updated `README.md`, `docs/architecture.md`, and `docs/project-organization.md` to document the new CI behavior and workflow location.
- Updated `WorkTracker.md` to move Story `STORY-3.4` to `In Review`.

## 2026-03-31 16:33 UTC

- The user accepted Story `3.4` after confirming there were no visual changes.
- Marked Story `3.4` as `Done` in `WorkTracker.md`.
- Preparing the git checkpoint for the accepted CI milestone before starting Story `3.5`.
