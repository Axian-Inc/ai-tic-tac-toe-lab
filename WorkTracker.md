# WorkTracker.md

## Overview

This file is the planning tracker for the Tic Tac Toe lab effort. It is intended to mimic a lightweight work-tracking backend such as Jira or Azure DevOps using markdown.

- Tracking timestamp: `2026-03-30 15:36 UTC`
- Planning status: `Execution complete through Phase 3; Phase 4 items remain backlog only`
- Planning owner: `Codex`
- Review owner: `User`
- Execution rule: complete work one phase at a time and stop after each meaningful milestone for user testing and explicit acceptance before continuing.

## Status Legend

- `Proposed`: planned but not yet approved for execution.
- `Ready`: approved and next in queue.
- `In Progress`: actively being implemented.
- `Blocked`: cannot continue until dependency or decision is resolved.
- `In Review`: ready for user review/testing.
- `Accepted`: reviewed and accepted by the user.
- `Done`: fully completed and closed.

## Epic EPIC-01 - Phase 1 Single-Player Foundation

- Title: `Phase 1 - Single-Player Tic Tac Toe`
- Description: `Build the initial React + TypeScript single-player application, including deterministic CPU play, a tested game module, polished gameplay feedback, documentation, and command-line automation.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Phase 1 is complete. Stories 1.1 through 1.6 are done and accepted. Story 1.7 was removed from Phase 1 after it proved to be a future enhancement rather than required Phase 1 scope.`

### Story STORY-1.1

- Title: `Scaffold app foundation and developer scripts`
- Description: `Create the application structure, choose the React/TypeScript toolchain, establish package scripts, and define the initial source layout so future work has a stable base.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 12:52 UTC and accepted by the user on 2026-03-31. Vite + React + TypeScript scaffold is in place, scripts are defined, production build passes, and the local dev server responded successfully for milestone review. During the story, the unused codex dependency was identified as unnecessary, removed, and the dependency tree was cleaned back to zero audit findings.`

### Story STORY-1.2

- Title: `Implement core game domain and deterministic CPU`
- Description: `Build the reusable game module that owns board state, move ordering, turn tracking, winner detection, legal-move validation, and deterministic CPU move selection.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 13:13 UTC and accepted by the user on 2026-03-31. Added a pure game-domain module with state creation, move application, legal-move validation, winner detection, draw detection, move history tracking, and deterministic CPU move selection. A read-only domain preview was wired into the scaffold page only to prove integration without moving ahead into Story 1.3 gameplay UI work.`

### Story STORY-1.3

- Title: `Build landing page and in-game single-player flow`
- Description: `Implement the landing page, start-game action, game detail view, turn/winner messaging, quit flow, and rematch option for CPU games.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 13:18 UTC and accepted by the user on 2026-03-31. Added the landing page, start-game flow, in-game detail screen, CPU turn loop, quit action, and rematch action on top of the existing pure game domain. Verified with npm typecheck, production build, and a game-domain smoke test that confirmed deterministic CPU responses after player moves.`

### Story STORY-1.4

- Title: `Add move feedback, illegal-move handling, and win/loss celebration`
- Description: `Add hover/validity feedback, prevent illegal moves in the UI, and integrate confetti plus move/win/loss sounds consistent with the brief.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 13:25 UTC and accepted by the user on 2026-03-31. Added hover-based move hints, blocked-cell styling, explicit illegal-move feedback, lightweight move/win/loss/draw audio cues, and visual win/loss/draw celebration banners and highlighting. Verification passed with npm typecheck and production build.`

### Story STORY-1.5

- Title: `Add unit tests and Playwright coverage`
- Description: `Create automated tests for core game behaviors and an end-to-end Playwright script that exercises a full game including winning conditions from the command line.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 13:35 UTC and accepted by the user on 2026-03-31. Added Vitest unit coverage for the game domain, Playwright coverage for a full winning game flow, and terminal scripts for unit tests, e2e tests, and the combined suite. Verified with npm run test:unit, npm run test:e2e, and npm test.`

### Story STORY-1.6

- Title: `Document setup and define deployment baseline`
- Description: `Update the README, document architecture and project organization, and establish the initial IaC/deployment baseline needed to satisfy Phase 1 expectations.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 13:38 UTC and accepted by the user on 2026-03-31 14:06 UTC. Replaced the starter README with project-specific setup and usage guidance, added architecture and project-organization docs, added a static AWS deployment baseline under infra/, and aligned package scripts and ignore rules with the documented workflow. Verified with npm run build and bash -n infra/deploy-static-site.sh.`

## Epic EPIC-02 - Phase 2 Multiplayer and WebSockets

- Title: `Phase 2 - Multiplayer + WebSocket Expansion`
- Description: `Extend the system with a server-backed multiplayer mode that validates moves, broadcasts updates over websockets, handles resign/abandonment, preserves game history, and updates infrastructure and docs.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Phase 2 is complete. Stories 2.1 through 2.6 are done and accepted. Single-player remains intact, multiplayer is implemented end-to-end, and the repo now includes the Phase 2 deployment/documentation baseline.`

### Story STORY-2.1

- Title: `Define multiplayer architecture and shared contracts`
- Description: `Choose the backend structure, shared DTO/event contracts, game identifiers, and state model so client and server communicate predictably.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 14:18 UTC and accepted by the user on 2026-03-31 14:16 UTC. Added a shared multiplayer contract module, documented the backend shape and API/event decisions, established the future server directory boundary, and added unit coverage for contract constants and representative payload shapes. Verified with npm run typecheck, npm run build, and npm run test:unit.`

### Story STORY-2.2

- Title: `Implement game lifecycle API endpoints`
- Description: `Add endpoints for game creation, game listing, join, move submission, resign, and abandonment checks with server-side validation.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 14:32 UTC and accepted by the user on 2026-03-31 14:29 UTC. Added an in-memory multiplayer service plus HTTP routes for create, list, join, move, resign, and abandonment-check. Corrected the no-auth command contract so mutation requests carry the server-issued sessionId. Added server scripts and HTTP integration tests. Verified with npm install, npm run typecheck, npm run build, npm run test:unit, and npm run test:server.`

### Story STORY-2.3

- Title: `Add websocket broadcast, replay, and catch-up support`
- Description: `Implement websocket subscriptions and enough persisted state/history for clients and spectators to catch up to live games and replay prior moves.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 14:44 UTC and accepted by the user on 2026-03-31 14:36 UTC. Added `/ws?gameId=...` subscriptions, immediate resync snapshots on connect, service-level event publication for live join/move/resign/abandonment updates, and timestamped move history for replay/catch-up. Added WebSocket transport tests and updated the multiplayer architecture docs. Verified with npm install, npm run typecheck, npm run build, npm run test:unit, and npm run test:server.`

### Story STORY-2.4

- Title: `Build multiplayer client create/join/live-update flows`
- Description: `Update the client so users can create multiplayer games, join waiting games, receive remote moves asynchronously, and play through a full multiplayer session.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 14:58 UTC and accepted by the user on 2026-03-31 14:51 UTC. Added a multiplayer lobby, create/join flows, live multiplayer game screen, browser-side HTTP/WebSocket client helpers, Vite proxying for local development, and a two-client Playwright flow that proves create/join/live-move behavior. Verified with npm run typecheck, npm run test:server, and npm run test:e2e.`

### Story STORY-2.5

- Title: `Implement abandonment, resign, and concurrency controls`
- Description: `Enforce the 3-minute abandonment rule, allow resign actions, cap concurrent active games at 25, and return the correct failure responses when limits are reached.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 15:02 UTC and accepted by the user on 2026-03-31 14:57 UTC. Enforced the 25-game concurrent cap with HTTP 429s, hardened abandonment and resign edge-case handling, and expanded server integration coverage for limit and failure-path behavior. Verified with npm run test:server, npm run typecheck, and npm run build.`

### Story STORY-2.6

- Title: `Expand tests, IaC, and docs for multiplayer`
- Description: `Add server and integration coverage for multiplayer behavior, update infrastructure for the expanded footprint, and document the architecture and operating model.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 15:06 UTC and accepted by the user on 2026-03-31 15:01 UTC. Added low-cost multiplayer API deployment assets, packaging scripts, updated deployment docs, and aligned Phase 2 architecture/project-organization guidance with the server footprint. Verified with npm run package:server, bash -n on deploy scripts, npm run test:server, and npm run build.`

## Epic EPIC-03 - Phase 3 Spectator View, Coverage, and CI

- Title: `Phase 3 - Spectator Mode + CI Pipeline`
- Description: `Add real-time game spectating, coverage reporting, and a pull-request build pipeline that compiles and tests the project automatically.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Phase 3 is complete and accepted on 2026-03-31 16:39 UTC. Spectator discovery/viewing, terminal coverage generation, and the pull request workflow are all in place, with the final documentation package aligned to the implemented codebase.`

### Story STORY-3.1

- Title: `Expose active-game spectator data from the server`
- Description: `Extend the server so clients can list active games, subscribe to a selected game, receive the current state, and continue receiving live updates.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 15:18 UTC, reviewed by the user, and accepted on 2026-03-31 15:21 UTC. Added a spectator-oriented game-read endpoint, verified active-game discovery through the existing list API, and expanded server tests for current-state reads while keeping the WebSocket event model aligned with Phase 2. Verified with npm run test:server, npm run typecheck, and npm run build.`

### Story STORY-3.2

- Title: `Build spectator UI flow`
- Description: `Add a Spectate entry point, active-game list, selected-game viewer, and live updates in the client so games can be watched in real time.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 15:29 UTC, reviewed by the user, and accepted on 2026-03-31 15:30 UTC. Added a spectator entry point on the landing screen, an active-game spectator lobby, and a read-only live viewer that hydrates from GET /games/{id} before following WebSocket updates. Verified with npm run typecheck, npm run build, npm run test:server, and npm run test:e2e.`

### Story STORY-3.3

- Title: `Add terminal coverage reporting`
- Description: `Configure the project so code coverage can be generated from the command line and reported in a repeatable way for local use and CI.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 15:34 UTC, reviewed by the user, and accepted on 2026-03-31 16:00 UTC. Added npm run coverage, a merged Vitest coverage configuration for the unit and server suites, and stable coverage artifacts under coverage/. Verified with npm run coverage, npm run typecheck, and npm run build.`

### Story STORY-3.4

- Title: `Create GitHub Actions pull request pipeline`
- Description: `Add a PR pipeline that installs dependencies, builds/packages the application, runs unit tests, and runs coverage generation.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 16:08 UTC, reviewed by the user, and accepted on 2026-03-31 16:33 UTC. Added a GitHub Actions pull request workflow that runs npm ci, npm run build, npm run test:unit, npm run test:server, npm run coverage, and npm run package:server. Verified locally with npm ci, npm run build, npm run test:unit, npm run test:server, npm run coverage, and npm run package:server.`

### Story STORY-3.5

- Title: `Finalize docs and close-out criteria`
- Description: `Update README and supporting docs to reflect spectator mode, CI, coverage, and final operating instructions, then prepare the project for final acceptance review.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Done`
- Assignment: `Codex`
- Comments: `Completed on 2026-03-31 16:37 UTC, reviewed by the user, and accepted on 2026-03-31 16:39 UTC. Updated the top-level repo guidance to reflect the implemented spectator, coverage, CI, and deployment state; corrected stale project memory in AGENTS.md; and aligned the close-out docs for final Phase 3 acceptance review.`

## Epic EPIC-04 - Post-Phase UX Enhancements

- Title: `Phase 4 - Optional UX Refinements`
- Description: `Track non-required UX refinements that should be considered only after the committed phase scope is complete and accepted.`
- Date/Time: `2026-03-31 14:05 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Backlog only. These items are intentionally deferred so they do not disrupt committed phase work.`

### Story STORY-4.1

- Title: `Relocate the dynamic game-status banner without broad layout churn`
- Description: `Move the larger changing game-status area, such as the green "Victory achieved." status treatment, away from the top placement that causes layout jump during play. Scope this as a focused UI adjustment rather than a general status-mode system. Preserve the existing compact summary pills and keep the change narrow enough to review visually in isolation.`
- Date/Time: `2026-03-31 14:05 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `This story replaces the earlier Phase 1 Story 1.7 after the original implementation was judged too broad and not required for Phase 1 completion.`

## Current Tracker Note

- Phase 1 is closed and accepted.
- Phase 2 is closed and accepted.
- Phase 3 is closed and accepted.
- Epic `EPIC-04` remains deferred backlog only.
