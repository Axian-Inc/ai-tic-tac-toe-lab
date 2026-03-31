# WorkTracker.md

## Overview

This file is the planning tracker for the Tic Tac Toe lab effort. It is intended to mimic a lightweight work-tracking backend such as Jira or Azure DevOps using markdown.

- Tracking timestamp: `2026-03-30 15:36 UTC`
- Planning status: `Proposed for Review`
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
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `This is the first execution epic. No Phase 2 or Phase 3 implementation should start before this epic is accepted.`

### Story STORY-1.1

- Title: `Scaffold app foundation and developer scripts`
- Description: `Create the application structure, choose the React/TypeScript toolchain, establish package scripts, and define the initial source layout so future work has a stable base.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Meaningful milestone. Stop for user review after the app boots locally and scripts are defined.`

### Story STORY-1.2

- Title: `Implement core game domain and deterministic CPU`
- Description: `Build the reusable game module that owns board state, move ordering, turn tracking, winner detection, legal-move validation, and deterministic CPU move selection.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Keep this logic UI-independent so it is easy to test and later reuse for multiplayer/server validation.`

### Story STORY-1.3

- Title: `Build landing page and in-game single-player flow`
- Description: `Implement the landing page, start-game action, game detail view, turn/winner messaging, quit flow, and rematch option for CPU games.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Meaningful milestone. Stop for user testing once a full game can be played end-to-end in the UI.`

### Story STORY-1.4

- Title: `Add move feedback, illegal-move handling, and win/loss celebration`
- Description: `Add hover/validity feedback, prevent illegal moves in the UI, and integrate confetti plus move/win/loss sounds consistent with the brief.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Keep assets and behavior lightweight and easy to maintain.`

### Story STORY-1.5

- Title: `Add unit tests and Playwright coverage`
- Description: `Create automated tests for core game behaviors and an end-to-end Playwright script that exercises a full game including winning conditions from the command line.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Meaningful milestone. Stop for user review after tests are green and runnable through documented commands.`

### Story STORY-1.6

- Title: `Document setup and define deployment baseline`
- Description: `Update the README, document architecture and project organization, and establish the initial IaC/deployment baseline needed to satisfy Phase 1 expectations.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Phase 1 closes only after docs are current and the user accepts the deliverable set.`

## Epic EPIC-02 - Phase 2 Multiplayer and WebSockets

- Title: `Phase 2 - Multiplayer + WebSocket Expansion`
- Description: `Extend the system with a server-backed multiplayer mode that validates moves, broadcasts updates over websockets, handles resign/abandonment, preserves game history, and updates infrastructure and docs.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Planning only until Epic 01 is accepted. Keep Phase 1 compatibility intact.`

### Story STORY-2.1

- Title: `Define multiplayer architecture and shared contracts`
- Description: `Choose the backend structure, shared DTO/event contracts, game identifiers, and state model so client and server communicate predictably.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Meaningful milestone. Stop for review after the API/event contract and project structure are agreed.`

### Story STORY-2.2

- Title: `Implement game lifecycle API endpoints`
- Description: `Add endpoints for game creation, game listing, join, move submission, resign, and abandonment checks with server-side validation.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `The server must remain authoritative for command validation and game transitions.`

### Story STORY-2.3

- Title: `Add websocket broadcast, replay, and catch-up support`
- Description: `Implement websocket subscriptions and enough persisted state/history for clients and spectators to catch up to live games and replay prior moves.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Design this so later spectator work in Phase 3 can build on it without rework.`

### Story STORY-2.4

- Title: `Build multiplayer client create/join/live-update flows`
- Description: `Update the client so users can create multiplayer games, join waiting games, receive remote moves asynchronously, and play through a full multiplayer session.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Meaningful milestone. Stop for user testing once two clients can create, join, and exchange moves in real time.`

### Story STORY-2.5

- Title: `Implement abandonment, resign, and concurrency controls`
- Description: `Enforce the 3-minute abandonment rule, allow resign actions, cap concurrent active games at 25, and return the correct failure responses when limits are reached.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `This story includes edge-case handling that should be heavily test-driven.`

### Story STORY-2.6

- Title: `Expand tests, IaC, and docs for multiplayer`
- Description: `Add server and integration coverage for multiplayer behavior, update infrastructure for the expanded footprint, and document the architecture and operating model.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Epic 02 closes only after the user accepts multiplayer behavior and supporting docs/infrastructure updates.`

## Epic EPIC-03 - Phase 3 Spectator View, Coverage, and CI

- Title: `Phase 3 - Spectator Mode + CI Pipeline`
- Description: `Add real-time game spectating, coverage reporting, and a pull-request build pipeline that compiles and tests the project automatically.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Planning only until Epic 02 is accepted.`

### Story STORY-3.1

- Title: `Expose active-game spectator data from the server`
- Description: `Extend the server so clients can list active games, subscribe to a selected game, receive the current state, and continue receiving live updates.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Keep the API aligned with the multiplayer event model introduced in Phase 2.`

### Story STORY-3.2

- Title: `Build spectator UI flow`
- Description: `Add a Spectate entry point, active-game list, selected-game viewer, and live updates in the client so games can be watched in real time.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Meaningful milestone. Stop for user testing when a live game can be spectated end-to-end.`

### Story STORY-3.3

- Title: `Add terminal coverage reporting`
- Description: `Configure the project so code coverage can be generated from the command line and reported in a repeatable way for local use and CI.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Prefer simple scripts and clear output paths over overly complex tooling.`

### Story STORY-3.4

- Title: `Create GitHub Actions pull request pipeline`
- Description: `Add a PR pipeline that installs dependencies, builds/packages the application, runs unit tests, and runs coverage generation.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Meaningful milestone. Stop for user review after the workflow is checked in and logically sound.`

### Story STORY-3.5

- Title: `Finalize docs and close-out criteria`
- Description: `Update README and supporting docs to reflect spectator mode, CI, coverage, and final operating instructions, then prepare the project for final acceptance review.`
- Date/Time: `2026-03-30 15:36 UTC`
- Status: `Proposed`
- Assignment: `Codex`
- Comments: `Epic 03 closes only after the user validates the final experience and documentation package.`

## Review Notes Requested

Please review:

- whether the epic breakdown matches how you want to stage the work,
- whether the story boundaries feel right for milestone-based testing,
- whether any story should be split, merged, reprioritized, or reassigned,
- whether you want additional backlog fields such as priority, tags, or dependencies.
