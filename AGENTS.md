# Agent Instructions

## Mission

Build and operate the three-phase AI Tic-Tac-Toe application described in
`docs/agent-orchestration-plan.md`. Treat documentation, tests, CI/CD, and
infrastructure as required product deliverables.

## Starting Point and Branches

- `zebanaya-kepler` is the shared integration branch and the only routine
  merge target for agent work.
- Bootstrap `zebanaya-kepler` once from `origin/00-devcontainer-starter`. After
  that bootstrap, create every agent branch from the latest
  `zebanaya-kepler`, not directly from the starter branch.
- Name every branch `{agent-name}/{branch-name}`. Use lowercase kebab-case for
  both segments.
- Reserved long-lived branches are:
  - `coordinator/contracts`
  - `application/product`
  - `quality/acceptance`
  - `docs-delivery/documentation`
- Short-lived branches follow the same convention, for example
  `application/phase-2-websocket-client` or `quality/phase-3-spectator-e2e`.
- An agent may commit only on a branch whose first path segment is that
  agent's name.
- Use a separate Git worktree for each concurrently active agent. Never switch
  another agent's worktree to a different branch.
- Do not merge directly to `main`. Open handoffs toward
  `zebanaya-kepler`; only the coordinator merges accepted work.
- Synchronize an agent branch with the latest `zebanaya-kepler` before final
  handoff and resolve conflicts on the agent branch.
- Every push produced by merging an agent branch into `zebanaya-kepler` must
  trigger the CI/CD workflow. Pull requests targeting `zebanaya-kepler` must
  also run the non-deployment verification checks before merge.
- Use Conventional Commits, such as `feat(game): reject occupied cells`,
  `test(api): cover active-game capacity`, or `docs(aws): explain rollback`.

## Agents and Ownership

### Coordinator

The coordinator owns architecture decisions, public contracts, sequencing,
integration review, and phase gates. It does not absorb unfinished feature
work merely to bypass a failed handoff.

The coordinator must:

1. Bootstrap `zebanaya-kepler` from `origin/00-devcontainer-starter`, protect
   it as the shared integration branch, and keep direct feature commits off it.
2. Freeze the game vocabulary, board coordinates, root commands, HTTP
   schemas, WebSocket event envelopes, and error semantics before dependent
   work starts.
3. Merge accepted work in this order: contracts/scaffold, application, tests,
   documentation/delivery, integration corrections.
4. Run the complete verification suite after every merge.
5. Record architectural decisions under `docs/architecture/`.
6. Reject a phase if required documentation or reproducible test evidence is
   absent.

### Application Agent

The application agent owns product code under `apps/`, reusable code under
`packages/`, public API definitions under `contracts/`, and the root dependency
lockfile. Follow the additional instructions in `apps/AGENTS.md`.

### Quality Agent

The quality agent independently proves acceptance behavior and owns `tests/`
and test/coverage configuration. Follow `tests/AGENTS.md`. It may add a failing
acceptance test before implementation, but it must clearly identify the
blocking ticket and expected behavior in the handoff.

### Documentation/Delivery Agent

The documentation/delivery agent owns the README, `docs/`, `.devcontainer/`,
`infra/`, and `.github/`. Follow the scoped instructions in those directories.
This agent is authorized to configure CI/CD and AWS infrastructure, but must
not deploy or mutate an AWS environment without explicit approval and named
credentials/account scope.

## File and Dependency Boundaries

- The application agent is the only routine editor of the root lockfile.
  Other agents request dependency changes in their handoff.
- An agent editing outside its ownership area must announce the reason in its
  handoff and obtain coordinator review.
- Public contract changes require coordinator approval before implementation.
- Never commit credentials, `.env` files containing secrets, local Codex auth,
  AWS profiles, generated coverage, Playwright traces, build output, or CDK
  deployment state.
- Preserve unrelated changes in a shared worktree. Do not reset, clean, or
  rewrite another agent's work.

## Required Architecture

- `apps/web`: Vite, React, and TypeScript client.
- `packages/game-core`: pure Phase 1 game state and deterministic CPU logic.
- `apps/api`: .NET 10 C# backend/application services.
- `contracts/game-rule-vectors.json`: shared rule examples run by TypeScript
  and C# tests to detect behavioral drift.
- `contracts/openapi.yaml`: HTTP contract.
- `contracts/websocket-events.md`: versioned event contract.
- `infra/cdk`: AWS CDK TypeScript infrastructure.
- AWS target: S3/CloudFront for the web app and API Gateway HTTP/WebSocket,
  .NET Lambda, and DynamoDB for multiplayer.

Game commands must be validated by the authoritative server in multiplayer.
Persist enough ordered event data to rebuild a game and catch up a late client.
Use sequence numbers and idempotency for reconnects and repeated delivery.
Enforce the 25-active-game ceiling atomically, not with a count-then-create
race. Abandonment decisions use server time and must be idempotent.

## Phase Gates

No phase is complete until its functional behavior, automated tests,
documentation, and deployment artifacts are all present.

### Phase 1

- Local deterministic single-player game is complete.
- The game module tracks state, ordered moves, turn, winner, and draw.
- Illegal moves are impossible through both the domain and UI.
- Landing, game detail, quit, rematch, feedback, confetti, and distinct sounds
  meet the supplied requirements.
- Unit tests and a full-game Playwright test run from the command line.
- S3/CloudFront IaC synthesizes and the deployment procedure is documented.

### Phase 2

- Server-authoritative multiplayer create, list, join, move, resign, and
  abandonment flows work.
- Clients receive asynchronous updates over WebSockets and can catch up.
- At most 25 active multiplayer games are accepted under concurrent requests.
- Ordered state/event history is preserved.
- Single-player regression and multiplayer tests pass together.
- IaC includes the low-cost backend footprint.

### Phase 3

- Active games can be listed and spectated in real time.
- Spectators catch up before consuming live events and cannot issue player
  commands.
- Coverage can be generated from the terminal.
- PR CI compiles/packages, runs tests and coverage, and synthesizes IaC.
- A push to `zebanaya-kepler`, including every accepted merge, triggers the
  post-merge CI/CD workflow.

## Stable Command Contract

The scaffold must expose these root commands. The coordinator may approve a
different implementation, but not different user-facing names.

```text
npm ci
npm run lint
npm run test:unit
npm run test:server
npm run test:e2e
npm run coverage
npm run build
npm run infra:synth
npm run verify
```

`npm run verify` must be the non-deployment CI gate and must fail on any failed
required check.

## Ticket and Handoff Protocol

Each work item is a Markdown file under `docs/tickets/` with an ID, owner,
dependencies, acceptance criteria, test evidence, documentation impact,
branch, commit, and status.

Every handoff must contain:

1. Completed ticket IDs.
2. Source branch and commit SHA.
3. Commands executed and their results.
4. Changed public contracts or migrations.
5. Documentation added or still required.
6. Risks, limitations, and follow-up tickets.

Agents do not approve their own handoffs. The coordinator validates the ticket
criteria and records integration results before merging.
