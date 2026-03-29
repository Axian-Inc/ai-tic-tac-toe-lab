# Decisions

This file records material project decisions and tradeoffs.

## 2026-03-29

### Decision

The landing page will carry an explicit release watermark, and bumping that watermark is part of a full frontend deployment.

### Rationale

- Static asset deployments behind CloudFront can otherwise be hard to distinguish visually from a previously cached release
- A lightweight visible release marker makes it easy to confirm that the live frontend matches the expected repo state
- This gives both humans and AI agents a simple post-deploy verification target without requiring browser devtools or bundle inspection

### Impact

- `src/routes/LandingPage.tsx` includes a hard-coded landing-page watermark value
- A full frontend deployment should bump that value before rebuilding and publishing assets
- Deployment documentation should instruct operators to compare the live watermark against the expected release value

### Follow-Up

- Keep the deployment runbook aligned with this release-verification step

## 2026-03-29

### Decision

Phase 3 will treat multiplayer replay as a page-entry and user-invoked viewing mode that is independent from whether the viewer is a player or a spectator.

### Rationale

- Returning players should still see replay and catch-up behavior without losing their player identity in the UI
- Third-party spectators should see the same replay system without needing a separate rendering path
- Active-game opens should show how the current board state was reached before switching to live updates
- Finished-game opens should replay the full move history before settling on the terminal state
- A dedicated replay mode is easier to extend with a manual replay button than the current `participant === null` gating

### Impact

- The frontend replay state must be decoupled from stored participant session state
- Opening an active multiplayer game will replay moves up to the latest known move, then resume live updates
- Opening a finished multiplayer game will replay all moves to the end state for both players and spectators
- Manual replay controls can rerun the same catch-up logic in both active and finished games
- If live updates arrive during replay, the client should finish the current replay target and then sync to the latest authoritative state

### Follow-Up

- Phase 3 implementation should add explicit replay state, replay controls, and tests for returning-player and spectator catch-up behavior

## 2026-03-29

### Decision

Phase 3 code coverage reporting will cover frontend and backend Vitest suites only, with separate report outputs and terminal commands for each scope plus a combined command.

### Rationale

- The repository already uses Vitest for both the frontend and backend, so coverage can be added with minimal tool sprawl
- Separate frontend and backend reports make it easier to understand what runtime each number represents
- Playwright coverage would add extra instrumentation and report-merging complexity that is not needed for the initial Phase 3 rollout
- A terminal-first workflow fits the existing local development and validation style of the project

### Impact

- The root package should expose coverage commands for frontend-only, backend-only, and combined generation
- Coverage artifacts should be written to `coverage/frontend/` and `coverage/backend/`
- Reports should include human-readable HTML output and machine-readable artifacts suitable for future CI use
- README and project documentation should explain how to generate coverage and where to find the resulting reports
- End-to-end Playwright tests remain part of validation but are not included in the initial coverage report

### Follow-Up

- Phase 3 implementation should add the scripts, coverage configuration, and documentation updates described above
- Revisit Playwright-based coverage later only if the added complexity is justified by a reporting need

## 2026-03-29

### Decision

The initial Phase 3 build pipeline will run in GitHub Actions on pull requests and will validate frontend build, backend build, frontend Vitest tests, backend Vitest tests, and frontend-plus-backend coverage generation, while deferring Playwright end-to-end execution.

### Rationale

- Pull-request validation should be fast enough to use on every change without turning basic review into a long-running process
- The current repository already has deterministic frontend and backend Vitest suites that fit CI well
- Coverage generation aligns with the new Phase 3 reporting goal and can run in the same workflow
- Playwright support can be added later once the base PR workflow is stable and well-instrumented
- PR readers should be able to inspect test outcomes without digging only through raw logs

### Impact

- The repository should include a GitHub Actions workflow triggered by `pull_request`
- The PR workflow should run the same build and test commands that are available from the terminal
- The workflow should publish coverage artifacts for `coverage/frontend/` and `coverage/backend/`
- The workflow should emit machine-readable test results or summaries so PR checks expose readable test status
- Playwright remains outside the initial PR pipeline scope

### Follow-Up

- Phase 3 implementation should add the workflow file, any required test-result reporters, and documentation for local and PR-based validation
- Revisit Playwright as a later pipeline extension after the initial PR workflow is stable

## 2026-03-21

### Decision

Phase 2 introduces a server-brokered multiplayer architecture instead of peer-to-peer multiplayer.

### Rationale

- The server must validate moves before they become authoritative
- The server must broadcast remote moves and game lifecycle events asynchronously
- The server must enforce abandonment, resignation, and game concurrency rules
- Spectators require a shared authoritative event source
- Replay and catch-up need durable server-side game history

### Impact

- The system now needs an HTTP API and a WebSocket channel
- Multiplayer game state becomes server-authoritative
- The client must treat multiplayer actions as requests, not local facts
- Infrastructure must expand beyond static frontend hosting

### Follow-Up

- None

## 2026-03-22

### Decision

Multiplayer participant names are now part of the server-side game snapshot, and spectate is a separate client flow from create/join.

### Rationale

- Share-link joins need a required name before the O seat can be claimed
- The board UI should show recognizable player labels for players and spectators instead of generic `Player X` and `Player O`
- Spectate has a different intent than creating or joining, so combining those paths in one modal added avoidable confusion

### Impact

- `POST /games` and `POST /games/{id}/join` now carry player names
- Game snapshots now include `xPlayerName` and `oPlayerName`
- The landing page keeps `New Multiplayer` focused on create/join, while `Spectate` opens a separate read-only discovery flow

### Follow-Up

- None

## 2026-03-21

### Decision

Phase 2 will keep the backend in TypeScript and Node.js unless implementation pressure later requires a different runtime.

### Rationale

- The existing project is already TypeScript-based
- Reusing the same language across frontend and backend reduces setup and maintenance overhead
- This keeps Phase 2 focused on multiplayer behavior instead of introducing unnecessary stack complexity

### Impact

- Backend code, infrastructure integration, and shared domain logic can remain in the same language ecosystem
- Package management, testing, and developer workflow stay consistent across the project

### Follow-Up

- None

## 2026-03-21

### Decision

Phase 2 will use DynamoDB for multiplayer game storage from the start.

### Rationale

- Replay and live catch-up require durable server-side state
- DynamoDB fits the small, low-cost AWS footprint targeted for this phase
- It aligns well with Lambda-based request handling and event-oriented game records

### Impact

- Multiplayer state must be modeled around DynamoDB access patterns
- Game records need to preserve current state, move history, timestamps, and terminal outcomes
- Tests should cover persistence-backed behavior rather than an in-memory-only implementation

### Follow-Up

- None

## 2026-03-21

### Decision

Phase 2 infrastructure will use API Gateway, Lambda, DynamoDB, and API Gateway WebSocket APIs.

### Rationale

- This matches the low-cost AWS deployment target for the phase
- The footprint supports both request-response APIs and asynchronous game updates
- The service scale is small enough that serverless infrastructure is a pragmatic fit

### Impact

- Terraform must add HTTP API, WebSocket API, Lambda functions, IAM permissions, and DynamoDB resources
- Deployment now includes both frontend and backend infrastructure
- Runtime behavior must account for stateless Lambda execution and explicit persistence

### Follow-Up

- None

## 2026-03-21

### Decision

Spectating will use a dedicated `POST /games/{id}/spectate` endpoint in addition to WebSocket updates.

### Rationale

- A dedicated spectate action makes spectator intent explicit in the API
- It gives the server a clear place to validate game existence and return initial spectate state
- This keeps player join semantics separate from spectator flows

### Impact

- The API surface includes an explicit spectate operation
- Spectator state and catch-up behavior can be initiated through a normal HTTP request before or alongside WebSocket subscription

### Follow-Up

- None

## 2026-03-21

### Decision

Replay and live catch-up will use `GET /games/{id}` to return the current game snapshot and move history. WebSocket connections will be used for live event delivery only.

### Rationale

- Replay and catch-up are easier to reason about as normal HTTP reads
- Players, spectators, and future replay views can load authoritative game state without requiring a live socket
- The WebSocket protocol stays narrower and focused on asynchronous updates
- This keeps the API easier to test and debug than a socket-only catch-up design

### Impact

- The Phase 2 API now includes `GET /games/{id}` in addition to the previously listed endpoints
- The client flow for multiplayer becomes fetch current game state, then subscribe for live events
- The server must return enough state in the read model to rebuild the board and replay move order

### Follow-Up

- None

## 2026-03-21

### Decision

Phase 2 multiplayer actions will use server-generated, game-scoped capability tokens such as `playerId` and `spectatorId` instead of user accounts.

### Rationale

- The system has no auth layer, but the server still needs to distinguish anonymous participants
- Move, resign, and abandonment requests need an unambiguous actor identity within each game
- Game-scoped opaque ids preserve anonymous participation without introducing account management

### Impact

- Create and join responses must return player capability ids
- Spectate responses may return spectator capability ids
- Mutating multiplayer requests must include the appropriate participant id

### Follow-Up

- None

## 2026-03-21

### Decision

Spectator ids in Phase 2 will be lightweight game-scoped tokens and will not be persisted as durable spectator records.

### Rationale

- Spectators are read-only in Phase 2
- Durable spectator records add complexity without supporting a required feature
- Lightweight tokens preserve anonymous spectating without expanding the persistence model unnecessarily

### Impact

- `POST /games/{id}/spectate` can issue a spectator token without writing a long-lived spectator record
- Spectator participation does not need durable storage beyond live WebSocket connection metadata
- The design can evolve later if spectator-specific permissions or analytics become necessary

### Follow-Up

- None

## 2026-03-21

### Decision

Phase 2 will use separate DynamoDB tables for current game snapshots and ordered game event history.

### Rationale

- Current-state reads and replay history have different access patterns
- Separating snapshots from event history keeps hot game records small and efficient
- Ordered replay becomes simpler than storing a growing event array inside the main game item

### Impact

- The backend data model includes a `games` table and a `game_events` table
- `GET /games/{id}` can assemble the current snapshot from the game record plus ordered history reads
- Persistence and test setup must cover both tables

### Follow-Up

- Finalize exact key shapes and table names during implementation

## 2026-03-21

### Decision

Phase 2 will store WebSocket subscription metadata in a separate lightweight connections table.

### Rationale

- Connection state is operational metadata, not core game state
- Separating connection records keeps the game and event tables focused on durable gameplay data
- WebSocket subscriptions have different lifecycle and cleanup concerns than game records

### Impact

- Infrastructure will include an additional DynamoDB table for live connection metadata
- WebSocket connect and disconnect handlers must manage connection records explicitly
- Broadcast code will resolve subscribers through the connections table

### Follow-Up

- None

## 2026-03-21

### Decision

The WebSocket connections table will be keyed by `gameId` and `connectionId`, and connection cleanup will happen on disconnect and on failed broadcast attempts. Records may also use TTL as a passive cleanup backstop.

### Rationale

- Broadcast fan-out needs efficient lookup of all live subscribers for a single game
- `gameId` plus `connectionId` matches the primary access pattern cleanly
- API Gateway WebSocket disconnects are not guaranteed to be the only cleanup path, so failed-send cleanup and TTL provide resilience

### Impact

- The connections table schema should include at least `gameId`, `connectionId`, `participantType`, `participantId`, `connectedAt`, and optional TTL metadata
- WebSocket connect and disconnect handlers must manage connection records explicitly
- Broadcast code must delete stale connection records when sends fail with a gone/stale connection response

### Follow-Up

- None

## 2026-03-22

### Decision

Multiplayer games now carry a persisted `gameName` in the backend contract, and the client should show that name in discovery and game detail views instead of exposing raw game ids in the normal UI.

### Rationale

- Human-readable match names make join and spectate flows easier to follow than opaque ids
- The create flow already collects a game name, so keeping it local-only caused avoidable UI inconsistency
- Persisting the name keeps list, detail, replay, and share-entry views aligned on the same label

### Impact

- `POST /games` accepts an optional `gameName` and stores it with the game snapshot
- `GET /games/{id}`, `GET /games?status=...`, `POST /games/{id}/join`, and `POST /games/{id}/spectate` now include `gameName`
- The frontend create flow seeds a suggested animal-plus-city name and uses `gameName` as the primary visible label

### Follow-Up

- None

## 2026-03-21

### Decision

Create and join responses will include a frontend-friendly deep link for the game when the frontend base URL is available in configuration.

### Rationale

- Sharing or reopening multiplayer games is a core user workflow
- Returning a ready-to-use deep link reduces client-side URL assembly concerns
- The feature is low cost if the frontend base URL is already part of deployment configuration

### Impact

- Create and join responses should include a `gameUrl` field when configured
- Infrastructure and frontend environment configuration must expose the frontend base URL where needed
- If the base URL is unavailable in a local or test environment, the field can be omitted or null

### Follow-Up

- None

## 2026-03-21

### Decision

`GET /games/{id}` will return full event history in Phase 2 and will not implement pagination.

### Rationale

- Tic Tac Toe game histories are small
- Full-history reads keep replay and catch-up simple in the first implementation
- Pagination would add protocol and client complexity without practical benefit at this scale

### Impact

- The read API can return a complete ordered event list for a game
- Client replay and reconnect flows remain straightforward
- Pagination can be added later if the system evolves beyond the current game shape

### Follow-Up

- None

## 2026-03-21

### Decision

Phase 2 will use a simple read-then-create concurrency check for the 25-game cap instead of introducing a stricter reservation or counter mechanism.

### Rationale

- The workload is intentionally small
- The simpler design is easier to implement and explain in Phase 2
- Strict race-proof capacity control would add coordination complexity that is not justified yet

### Impact

- The concurrency cap is enforced at normal operating scale but is not perfectly race-proof under simultaneous creates
- The code should keep the capacity check isolated so it can be hardened later if needed

### Follow-Up

- None

## 2026-03-21

### Decision

Phase 2 will not introduce auth or user identity.

### Rationale

- Auth is outside the current delivery scope
- Anonymous multiplayer lowers implementation and infrastructure complexity
- This keeps effort focused on transport, state management, and gameplay correctness

### Impact

- Player and spectator actions are anonymous
- API design cannot rely on user accounts or sessions for authorization
- Client UX must work without login state

### Follow-Up

- None

## 2026-03-21

### Decision

The server will enforce a maximum of 25 concurrent multiplayer games.

### Rationale

- The project explicitly requires a hard concurrency cap
- A fixed cap keeps low-cost infrastructure more realistic for this phase
- Capacity enforcement needs to be visible at the API boundary

### Impact

- Game creation must fail with HTTP `429` when the cap is reached
- Tests must cover the concurrency ceiling
- Infrastructure sizing and persistence choices should assume a small workload

### Follow-Up

- None

## 2026-03-21

### Decision

The 25-game concurrency limit applies to multiplayer games with status `waiting` or `active`. Games with status `over` do not count toward the limit.

### Rationale

- `waiting` games still consume multiplayer capacity because they reserve a joinable slot
- `active` games are in progress and must count toward the cap
- `over` games should remain available for replay and catch-up history without blocking new game creation

### Impact

- Game creation must count all non-terminal games before accepting a new game
- The concurrency check should treat `waiting` and `active` as capacity-consuming states
- Completed, resigned, and abandoned games can remain stored with status `over` without affecting the cap

### Follow-Up

- None

## 2026-03-21

### Decision

Games abandoned for 3 minutes are ended by a server abandonment decision when a player probes for a check.

### Rationale

- The requirement says either client can request an abandonment decision
- A probe-driven decision avoids needing a background scheduler as a first implementation step
- The server remains authoritative for game completion and winner selection

### Impact

- Game records must store enough timing data to evaluate inactivity
- The API needs an abandonment-check operation
- Tests must cover the timeout boundary and winner outcome

### Follow-Up

- None

## 2026-03-22

### Decision

Phase 2 abandonment is now server-driven for stale active games instead of requiring a manual player probe as the primary mechanism.

### Rationale

- Probe-only abandonment left broken active games stranded indefinitely after frontend or connection failures
- The expected product behavior is that a turn idle for more than 3 minutes should automatically lose by abandonment
- Open player and spectator sessions still need a broadcast so the UI updates without manual intervention

### Impact

- Any active game with more than 3 minutes of inactivity since the last move is automatically ended as an abandonment loss for the player whose turn it is
- The backend opportunistically evaluates stale active games during normal reads and listings and broadcasts abandonment plus `game_over` events when it finalizes them
- Open active game pages use a low-frequency refresh so an online client can trigger the server-side decision without aggressive request churn
- The abandonment-check endpoint can remain for compatibility, but it is no longer the primary path for ending stale games

### Follow-Up

- None

## 2026-03-21

### Decision

When abandonment is confirmed, the non-idle player wins, and the game result must record that the win occurred by abandonment.

### Rationale

- The system needs a deterministic winner rule for abandonment decisions
- Recording abandonment separately preserves the ability to distinguish normal wins and losses from abandonment outcomes
- This keeps future stats or filtering options available without changing the result model later

### Impact

- Terminal game state must capture both winner and terminal reason
- Replay and game summary responses should expose that the outcome was by abandonment
- The client can later present or filter finished games by outcome type

### Follow-Up

- None
