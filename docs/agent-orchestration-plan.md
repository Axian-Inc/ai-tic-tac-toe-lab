# AI Tic-Tac-Toe Agent Orchestration Plan

## Objective

Deliver all three phases of the Tic-Tac-Toe application with product code,
independent acceptance testing, complete documentation, reproducible AWS
infrastructure, and PR automation. The repository begins as a devcontainer
starter, so environment and interface foundations precede feature work.

## Agents and Branches

All branches start at `origin/00-devcontainer-starter` and use
`{agent-name}/{branch-name}`.

| Agent | Initial branch | Ownership |
| --- | --- | --- |
| Coordinator | `coordinator/integration` | Contracts, sequencing, review, phase gates |
| Application | `application/product` | React client, game core, C# server |
| Quality | `quality/acceptance` | Unit, integration, Playwright, coverage |
| Documentation/Delivery | `docs-delivery/documentation` | Docs, tickets, devcontainer, CI/CD, AWS IaC |

Each concurrently active agent uses a separate Git worktree. An agent creates
short-lived work only beneath its own prefix, such as
`application/phase-1-game-core`. Work is handed to the coordinator and merged
into `coordinator/integration`; agents do not merge their own submissions.

## Architecture

```text
apps/web                 Vite + React + TypeScript
apps/api                 .NET 8 C# Lambda/application services
packages/game-core       Pure local game state and deterministic CPU
contracts                HTTP, WebSocket, and shared game-rule vectors
tests                    Integration and Playwright acceptance tests
infra/cdk                AWS CDK TypeScript
docs                     Requirements, ADRs, tickets, and operations
```

Phase 1 uses S3 and CloudFront. Multiplayer adds API Gateway HTTP/WebSocket,
.NET 8 Lambda, and DynamoDB. Games use ordered events so state can be replayed
and reconnecting players or spectators can catch up. Shared golden rule vectors
protect TypeScript/C# behavior from divergence.

## Wave 0: Foundation

1. Coordinator establishes game terminology, board coordinates, command names,
   HTTP schemas, WebSocket envelopes, error semantics, and the root command
   contract.
2. Documentation/Delivery imports phase requirements, creates ticket files and
   ADR templates, and updates the container with .NET 8 and Playwright needs.
3. Application creates the workspace, web scaffold, game package, .NET
   solution, contract locations, and root scripts.
4. Coordinator merges the scaffold early; other agents synchronize from
   integration before dependent work.

Foundation gate: clean dependency install, client build, server build, and IaC
synth entry points.

## Wave 1: Phase 1

Application implements the pure game state, move history, turns, terminal
states, deterministic beatable CPU, landing/game routes, legal-move feedback,
quit/rematch, confetti, and distinct sounds.

Quality develops game and UI tests plus a deterministic full-game Playwright
journey. Documentation/Delivery completes the README, Phase 1 tickets/ADRs,
S3/CloudFront CDK, deployment guidance, and an initial validation workflow.

The coordinator integrates contracts/scaffold first, then application, QA, and
delivery. Phase 1 closes only after command-line unit/E2E tests, build, synth,
documentation review, and approved deployment verification pass.

## Wave 2: Phase 2

The coordinator freezes create/list/join/move/resign/abandonment schemas,
WebSocket messages, reconnection, and error behavior before implementation.

Application implements server-authoritative C# commands, ordered persistence,
atomic 25-game enforcement, server-time abandonment, WebSocket broadcasting,
and multiplayer create/join/reconnect UI.

Quality covers command behavior, idempotency, concurrency, the 26th-game 429,
abandonment with a controlled clock, contract parity, and two-browser
Playwright play. Documentation/Delivery extends CDK, IAM, operations, costs,
and API/event documentation.

Phase 2 closes only when Phase 1 regression and multiplayer verification pass
together and the updated infrastructure synthesizes.

## Wave 3: Phase 3

Application adds active-game discovery and read-only spectator catch-up/live
updates. Quality adds a third browser context and terminal coverage reporting.
Documentation/Delivery completes the PR workflow, coverage artifacts,
deployment workflow, rollback, and spectator operations documentation.

Phase 3 closes when a spectator can join an active game, obtain ordered current
state, receive later moves, and cannot issue player commands; CI must compile,
package, test, cover, and synthesize the project.

## Integration and Handoffs

Final integration order for each phase:

1. Contracts and scaffold.
2. Application/domain work.
3. Acceptance tests and fixtures.
4. Documentation, CI/CD, and infrastructure.
5. Coordinator integration corrections.
6. Complete phase verification and deployment evidence.

Every handoff lists ticket IDs, branch, commit, commands/results, contract
changes, documentation, and risks. The coordinator rejects self-approved,
undocumented, untested, or contract-breaking work.

## Root Verification Contract

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

`npm run verify` is the complete non-deployment gate used locally and in CI.

## Principal Risks

- Add .NET and browser dependencies before backend/test work begins.
- Prevent client/server rule drift with shared golden vectors.
- Use an atomic capacity design; a count-then-create flow is invalid.
- Sequence and deduplicate WebSocket events and support state catch-up.
- Make abandonment server-timed and idempotent.
- Keep the deterministic CPU beatable so the required winning UI path can be
  tested.
- Keep secrets out of Git and use short-lived AWS credentials where possible.
- Enforce documentation through ticket and handoff gates rather than deferring
  it to the final phase.
