# Roadmap

This file tracks planned features, sequencing, and status.

## Current Phase

Phase 3 focuses on spectating and replay UX updates, code coverage reporting, and build pipeline improvements on top of the delivered multiplayer foundation.

## Phase 3 Scope

- Improve multiplayer catch-up and replay behavior for both players and spectators
- Preserve player identity in the UI while replaying finished games a player participated in
- Replay active games on page open until the latest known move, then resume live play
- Replay finished games on page open through the terminal move for both players and third-party spectators
- Add an in-game replay control so users can manually re-run replay or catch-up animations
- Reconcile live updates that arrive during replay by finishing the current replay target, then syncing to the newest authoritative state
- Add code coverage reporting for frontend and backend automated tests
- Add build pipeline automation for validation, test, and deployment-oriented checks

## Previous Phase

Phase 2 added server-brokered multiplayer to the existing Tic Tac Toe app while preserving the Phase 1 single-player experience.

## Scope

- Add an HTTP API server that brokers multiplayer games
- Accept and validate multiplayer commands on the server
- Broadcast multiplayer game events to listeners over WebSockets
- Allow active games to be spectated by players and third parties
- Preserve enough game state and move history to replay finished games and catch clients up to live games
- Support resign flows and server-side abandonment decisions
- Enforce a maximum of 25 concurrent multiplayer games and return HTTP `429` once the limit is reached
- Update the client to create and join waiting multiplayer games
- Use human-readable game names in multiplayer create, list, join, spectate, and detail flows
- Use persisted player names in multiplayer game detail views and require a name before a player can create or join a game
- Keep spectate as a separate discovery path from create/join so multiplayer entry flows remain intention-specific
- Preserve the local single-player mode and its current behavior
- Update AWS infrastructure to support the new backend footprint at low cost

## Candidate API

- `POST /games`
- `GET /games/{id}`
- `GET /games?status=waiting|active|over`
- `POST /games/{id}/join`
- `POST /games/{id}/moves`
- `POST /games/{id}/resign`
- `POST /games/{id}/spectate`
- `POST /games/{id}/abandonment-check`
- `WS /ws?gameId=...`

## Core Multiplayer Behavior

- Clients suggest moves to the server instead of applying remote multiplayer moves locally
- The server validates moves, updates game state, stores move history, and broadcasts resulting events
- A game can be spectated by both players and multiple third parties
- If the current turn has been idle for more than 3 minutes, the server abandons the game against the idle player
- The server marks the game `over` and broadcasts the winner to players and spectators
- A player can resign and the server ends the game with the other player as winner
- The system has no auth or identity layer in this phase

## Exit Criteria

- The app supports both single-player and multiplayer modes
- Single-player behavior remains intact and existing Playwright coverage still passes
- Users can create new multiplayer games and join waiting games
- Players receive asynchronous in-game multiplayer updates over WebSockets
- Up to 25 concurrent multiplayer games can run at once
- Game state and move order are preserved for live catch-up and replay
- Players can complete multiplayer games end-to-end, including wins, losses, and resignations
- Tests cover key multiplayer behavior including game creation limits, move handling, and abandonment
- IaC captures the new infrastructure footprint and remains deployable in AWS at low cost

## Likely Workstreams

- Frontend replay state model and multiplayer catch-up UX
- Spectator and returning-player behavior alignment
- Automated code coverage reporting for frontend and backend tests
- Build pipeline definition for build, test, and deployment validation
- Backend game service and transport design
- Persistence model for games, moves, and replay/catch-up state
- WebSocket event model and client synchronization
- Frontend multiplayer flows for create, join, spectate, and live updates
- Test coverage for server behavior and end-to-end multiplayer flows
- Terraform and AWS deployment changes for the new backend resources

## Phase 3 Implementation Plan

### 1. Spectating and replay UX

- Decouple viewer identity from replay behavior so replay works for both players and spectators
- Replay active multiplayer games on page load up to the latest known move, then return to live mode
- Replay finished multiplayer games on page load through the terminal move, regardless of whether the viewer is a player or a spectator
- Preserve player-specific UI framing during replay when the browser has a valid participant session for that game
- Add an explicit replay action that reruns the current game's replay or catch-up animation on demand
- Surface a lightweight live-sync hint when new moves arrive while replay is still in progress

### 2. Code coverage reports

- Add frontend coverage reporting to the existing root Vitest workflow
- Add backend coverage reporting to the backend Vitest workflow
- Exclude Playwright end-to-end tests from coverage reporting for the initial Phase 3 implementation
- Provide terminal commands for frontend-only, backend-only, and combined coverage generation
- Write frontend coverage artifacts to `coverage/frontend/`
- Write backend coverage artifacts to `coverage/backend/`
- Generate HTML reports for local inspection and machine-readable artifacts for later CI use
- Update project documentation with the terminal commands, artifact paths, and expectations for reviewing coverage output

### 3. Build pipeline

- Add a GitHub Actions workflow that runs on pull requests
- Validate frontend build, backend build, frontend unit tests, and backend unit tests in the PR workflow
- Run the combined coverage command in the PR workflow after test execution
- Exclude Playwright end-to-end tests from the initial PR pipeline to keep the first pipeline stable and fast
- Publish frontend and backend coverage artifacts from the workflow
- Generate machine-readable frontend and backend test result artifacts so PR checks expose more than raw logs
- Add workflow summary output or PR-visible test reporting so test results are easy to inspect from the pull request
- Ensure the pipeline remains runnable through equivalent terminal commands during local development
- Document workflow scope, artifact locations, and any required environment assumptions

## Implementation Plan

### 1. Backend foundation

- Add a TypeScript/Node backend package for the multiplayer API and WebSocket handlers
- Define the multiplayer domain model separately from transport concerns
- Reuse existing Tic Tac Toe game rules where practical so win and move validation logic do not diverge between modes

### 2. Multiplayer domain and persistence

- Define game lifecycle states: `waiting`, `active`, `over`
- Define terminal reasons including normal finish, resignation, and abandonment
- Define the DynamoDB data model for games, move history, timestamps, and connection metadata needed for WebSocket fan-out
- Implement repository operations for create, join, move submission, resign, spectate, read, list, and abandonment checks
- Enforce the 25-game limit against `waiting` and `active` games only

### 3. HTTP and WebSocket API

- Implement `POST /games` to create a waiting multiplayer game
- Implement `GET /games/{id}` to return current state and move history for replay and catch-up
- Implement `GET /games?status=...` to list waiting, active, or over games
- Implement `POST /games/{id}/join` to join a waiting game and transition it to active
- Implement `POST /games/{id}/moves` to validate and apply moves server-side
- Implement `POST /games/{id}/resign` to end a game with a resignation outcome
- Implement `POST /games/{id}/spectate` to validate spectator access and return initial spectate information
- Implement server-driven abandonment evaluation for the 3-minute inactivity rule and end stale games automatically
- Implement WebSocket subscribe and broadcast behavior for move, join, resign, abandonment, and game-over events

### 4. Event model and synchronization

- Define server event types for game created, game joined, move accepted, game resigned, abandonment decided, and game over
- Ensure the event model includes enough data for clients to update local state without refetching on every message
- Make reconnect flow fetch `GET /games/{id}` first, then resume live updates over WebSocket

### 5. Frontend multiplayer UX

- Add a multiplayer entry path alongside the existing single-player mode
- Add UI to create a multiplayer game
- Add UI to list and join waiting multiplayer games
- Add client state management for multiplayer snapshots, move submission, and WebSocket updates
- Keep single-player mode unchanged in behavior
- Support spectator and replay-capable state shapes even if the first UI only exposes player create/join flows

### 6. Testing

- Add backend tests for create, join, move validation, resignation, abandonment, and the 25-game limit
- Add tests for persistence-backed game reconstruction and move ordering
- Add integration tests for HTTP plus WebSocket flow where practical
- Keep existing single-player unit and Playwright coverage passing
- Add multiplayer-focused client or end-to-end tests for create, join, and live update behavior

### 7. Infrastructure and deployment

- Extend Terraform to provision DynamoDB, HTTP API Gateway, WebSocket API Gateway, Lambda functions, IAM roles, and required permissions
- Wire the frontend deployment to the backend API and WebSocket endpoints through environment configuration
- Preserve low-cost defaults suitable for a small workload
- Update deployment documentation and release flow for the expanded stack

## Implementation Backlog

### Backlog order

1. Backend workspace and package layout
2. Shared multiplayer domain model and rules
3. DynamoDB repositories and persistence wiring
4. HTTP handlers for create, read, list, join, move, resign, spectate, and abandonment
5. WebSocket connection handlers and broadcast support
6. Backend automated tests
7. Frontend multiplayer flows
8. Frontend multiplayer tests
9. Terraform and deployment updates
10. End-to-end verification and rollout hardening

### Current backlog status

- Completed: 1. Backend workspace and package layout
- Completed: 2. Shared multiplayer domain model and rules
- Completed: 3. DynamoDB repositories and persistence wiring
- Completed: 4. HTTP handlers
- Completed: 5. WebSocket handlers and live broadcast
- Completed: 6. Backend automated tests
- Completed: 7. Frontend multiplayer flows
- Completed: 8. Frontend multiplayer tests
- Completed: 9. Terraform and deployment updates
- In Progress: 10. End-to-end verification and rollout hardening

### 1. Backend workspace and package layout

- Create a `backend/` package with TypeScript build, test, and lint wiring
- Add package scripts for local build and test execution
- Establish internal folders for `domain`, `repositories`, `handlers`, `http`, `websocket`, and shared utilities

### 2. Shared multiplayer domain model and rules

- Define multiplayer game types, statuses, marks, terminal reasons, and event types
- Reuse or adapt existing Tic Tac Toe board and win validation logic for server-side play
- Implement pure domain operations for create, join, move, resign, and abandonment decisions

### 3. DynamoDB repositories and persistence wiring

- Implement the `games` table repository for snapshot reads and writes
- Implement the `game_events` table repository for ordered event history
- Implement the `connections` table repository for live WebSocket subscribers
- Add repository tests for create/update/read/list access patterns

### 4. HTTP handlers

- Implement `POST /games`
- Implement `GET /games/{id}`
- Implement `GET /games?status=...`
- Implement `POST /games/{id}/join`
- Implement `POST /games/{id}/moves`
- Implement `POST /games/{id}/resign`
- Implement `POST /games/{id}/spectate`
- Implement `POST /games/{id}/abandonment-check`
- Standardize request validation and error response formatting

### 5. WebSocket handlers and live broadcast

- Implement connect, disconnect, and default WebSocket handlers
- Store and remove connection records in the connections table
- Broadcast multiplayer events to all subscribers for a game
- Delete stale connection records on failed sends

### 6. Backend automated tests

- Add unit tests for domain rules and invalid moves
- Add repository tests for persistence-backed reconstruction and ordering
- Add handler or integration tests for create, join, move, resign, abandonment, and 25-game cap behavior
- Add tests for WebSocket subscription bookkeeping where practical

### 7. Frontend multiplayer flows

- Add multiplayer mode entry points alongside single-player mode
- Add UI to create a multiplayer game and display its shareable link
- Add UI to list waiting games and join one
- Add client fetch flow for `GET /games/{id}` plus WebSocket subscription
- Add local client state for multiplayer board updates, game over, resignation, and abandonment

### 8. Frontend multiplayer tests

- Add frontend tests for multiplayer create and join flows
- Add tests for receiving asynchronous move updates
- Preserve and rerun existing single-player unit and Playwright coverage

### 9. Terraform and deployment updates

- Add Terraform resources for DynamoDB tables, Lambdas, API Gateway HTTP routes, WebSocket API routes, IAM roles, and permissions
- Add frontend environment configuration for backend API and WebSocket URLs
- Update deployment steps for backend packaging and full-stack rollout

### 10. End-to-end verification and rollout hardening

- Verify create, join, move, resign, abandonment, and replay flows in a deployed environment
- Verify concurrency cap behavior and error responses
- Verify single-player behavior still works unchanged
- Document any operational caveats discovered during deployment validation

### Deployment Verification Notes

- Verified: existing local Playwright single-player suite passes
- Verified: deployed frontend now reaches the live HTTP API and loads waiting games from AWS
- Verified: deployed HTTP API supports create, join, move, and replay reads end to end
- Verified: deployed WebSocket connections now stabilize successfully and deliver asynchronous multiplayer updates in the live environment
- Verified: deployed stale active games are marked `over` with terminal reason `abandonment`
- Verified: deployed game-capacity enforcement returns HTTP `429` after the 25 non-terminal game limit is reached
- Verified: temporary capacity-test games were cleaned up by joining and resigning them

## Phase 3 Backlog

### Backlog order

1. Replay and catch-up UX refactor
2. Replay control UI and live-sync messaging
3. Frontend coverage reporting commands and artifacts
4. Backend coverage reporting commands and artifacts
5. Coverage documentation updates
6. PR build pipeline definition and automation
7. PR-visible test reporting and artifact publishing
8. Documentation and rollout notes

### Current backlog status

- Completed: 1. Replay and catch-up UX refactor
- Completed: 2. Replay control UI and live-sync messaging
- Completed: 3. Frontend coverage reporting commands and artifacts
- Completed: 4. Backend coverage reporting commands and artifacts
- Completed: 5. Coverage documentation updates
- Completed: 6. PR build pipeline definition and automation
- Completed: 7. PR-visible test reporting and artifact publishing
- In Progress: 8. Documentation and rollout notes

### Phase 3 Implementation Notes

- Implemented: multiplayer game pages now auto-replay active games to the latest known move on open, then resume live play
- Implemented: finished multiplayer games now replay on open for both returning players and third-party spectators
- Implemented: replay no longer depends on the viewer lacking a participant session, so returning players keep their player identity in the UI during replay
- Implemented: multiplayer game pages expose a manual replay control and suppress player actions while replay is in progress
- Implemented: terminal coverage commands now generate separate frontend and backend reports under `coverage/frontend/` and `coverage/backend/`
- Implemented: JUnit-style frontend and backend test report commands now generate artifacts under `test-results/`
- Implemented: a GitHub Actions pull-request workflow now runs frontend build, backend build, frontend tests, backend tests, coverage generation, artifact upload, and PR-visible unit test reporting
- Caveat: the GitHub Actions workflow is configured in-repo but has not yet been exercised through an actual pull request run from this workspace session
