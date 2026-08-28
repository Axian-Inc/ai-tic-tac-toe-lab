# AI Tic-Tac-Toe Lab

A three-phase Tic-Tac-Toe application built through coordinated application,
quality, documentation/delivery, and integration agents. The Phase 1
Vite/React single-player game, automated acceptance suites, and static AWS CDK
implementation are integrated on `zebanaya-kepler`. The merged non-deployment
CI gate passes; deployment to the Axian L&D account is still pending explicit
enablement and approval. Phases 2 and 3 add an authoritative .NET 10
multiplayer backend, WebSocket updates, replay/catch-up, and spectating.

## Start here

- [Versioned requirements](docs/requirements/README.md)
- [Current Phase 1 status](docs/phase-1-status.md)
- [Agent orchestration plan](docs/agent-orchestration-plan.md)
- [Delivery backlog](docs/tickets/README.md)
- [Architecture decisions](docs/architecture/README.md)
- [Operations](docs/operations/README.md)
- [Agent rules](AGENTS.md)

## Architecture

```text
apps/web                 Vite + React + TypeScript client
apps/api                 .NET 10 C# Lambda/application services
packages/game-core       Pure local game state and deterministic CPU
contracts                Approved HTTP, WebSocket, and rule-vector contracts
tests                    Integration and Playwright acceptance tests
infra/cdk                AWS CDK in TypeScript
docs                     Requirements, ADRs, tickets, and operations
```

Phase 1 uses private S3 behind CloudFront. The accepted Phase 2 hosting
direction uses API Gateway HTTP/WebSocket APIs, .NET 10 Lambda, and DynamoDB.
Exact public schemas and game vocabulary remain pending coordinator approval.

## Prerequisites

For the recommended VS Code Dev Container flow:

- Docker Desktop
- VS Code with the Dev Containers extension
- Git
- A local Codex CLI login if its authentication should be copied into the
  container

The container installs Node.js 20, .NET SDK 10, GitHub CLI, AWS CLI, Codex CLI,
and Linux libraries needed by Playwright. Project browsers are installed from
the project's pinned Playwright dependency rather than baked into the image.

For AWS work, access to the Axian L&D account is required. Do not place access
keys in source files, committed `.env` files, or devcontainer configuration.

## Clone and enter the integration flow

```bash
git clone https://github.com/Axian-Inc/ai-tic-tac-toe-lab.git
cd ai-tic-tac-toe-lab
git switch zebanaya-kepler
```

Agent branches start from current `zebanaya-kepler`, use
`{agent-name}/{branch-name}`, and merge back only after coordinator review.
For example:

```bash
git switch zebanaya-kepler
git pull --ff-only
git switch -c application/phase-1-single-player
```

Use one worktree per concurrent agent. Do not switch or clean another agent's
worktree.

## Dev Container

1. Sign in locally with Codex CLI if desired.
2. Open the repository in VS Code and choose **Reopen in Container**.
3. Wait for the image and post-create step to finish.
4. Verify tools:

   ```bash
   node --version
   dotnet --version
   aws --version
   gh --version
   codex --version
   ```

The Windows-oriented auth mount reads `${USERPROFILE}/.codex` as read-only and
copies only `auth.json` into the container user's home. If the host does not
define `USERPROFILE`, remove that mount locally and authenticate inside the
container; never commit an edited path or credentials.

## Local commands

From a clean checkout:

```bash
npm ci
npx playwright install chromium
npm run verify
```

Start the Phase 1 client locally with:

```bash
npm run build --workspace @tic-tac-toe/game-core
npm run dev --workspace @tic-tac-toe/web
```

The root command contract is:

| Command | Purpose |
| --- | --- |
| `npm run lint` | Static and documentation checks |
| `npm run test:unit` | Client and shared-domain unit tests |
| `npm run test:server` | .NET server tests |
| `npm run test:e2e` | Playwright acceptance journeys |
| `npm run coverage` | Generate coverage reports |
| `npm run build` | Build/package client and server |
| `npm run infra:synth` | Synthesize CDK without changing AWS |
| `npm run infra:deploy` | Guarded, approved deployment to the configured AWS target |
| `npm run verify` | Complete non-deployment CI gate |

## Phase 1 gameplay

Choose **Play vs. CPU** from the landing page. The human is `X`, moves first,
and can place a mark only in an open square. The UI distinguishes available
and unavailable squares and preserves the ordered move history. **Quit game**
returns to the landing page; after a completed game, **Rematch** starts a clean
board with the human moving first again.

The CPU is intentionally deterministic and beatable: it takes the
lowest-numbered immediate winning square, otherwise the lowest-numbered legal
square. Accepted moves request a generated thud cue. Wins add confetti and a
winning cue; losses provide a distinct cue and visible “Try again” feedback.
Audio can be muted and is supplementary, so blocked audio never prevents play.
Reduced-motion preferences suppress confetti animation while retaining the
written result.

## Roadmap

- Phase 1: deterministic, beatable CPU; legal-move feedback; quit/rematch;
  win/loss/move feedback; complete winning Playwright journey.
- Phase 2: create/join multiplayer games; server-validated moves; WebSocket
  updates; resignation; abandonment; replay; 25-active-game limit.
- Phase 3: list and spectate active games with ordered catch-up, live updates,
  coverage reporting, and completed PR/push automation.

See the [requirements index](docs/requirements/README.md) for the authoritative
acceptance statements.

## CI/CD

Pull requests targeting `zebanaya-kepler` and pushes to it run
`.github/workflows/validate.yml`. This validates the actual merge commit, not
only its PR head. The initial workflow calls `npm run verify`, installs .NET 10
and Chromium, and retains coverage or failure diagnostics.

The validation workflow's delivery job depends on successful verification and
runs only for a `zebanaya-kepler` push. AWS delivery is skipped unless all of
these are true:

- repository variable `ENABLE_AWS_DEPLOYMENT` is `true`;
- protected environment `axian-lnd` approves the job;
- `AWS_DEPLOY_ROLE_ARN` names a GitHub OIDC-trusted role;
- optional `AWS_REGION` is set (otherwise `us-west-2` is used);
- the repository provides `npm run infra:deploy`.

PR workflows never deploy. An AWS deploy or teardown also requires explicit
human authorization and confirmed account/region scope.

The integrated Phase 1 commit `1185521` passed the complete push verification
gate on 2026-08-28. Its deployment job was skipped because deployment was not
enabled, so this is build/test/synth evidence, not evidence of an AWS
deployment. See the
[Phase 1 status](docs/phase-1-status.md) for the remaining phase gate items.

## AWS and cost posture

Local builds and `npm run infra:synth` need no AWS credentials and must not
mutate an account. For approved manual inspection, prefer SSO or another
short-lived credential mechanism over static keys. Confirm identity before any
deployment:

```bash
aws sts get-caller-identity
aws configure get region
```

Phase 1 deployment and recovery procedures are in the
[static-hosting runbook](docs/operations/phase-1-aws-static-hosting.md).
Primary cost drivers are CloudFront requests/transfer, S3 storage, API Gateway
HTTP/WebSocket use, Lambda invocations/duration, DynamoDB requests/storage, and
CloudWatch logs/alarms. Detailed deployment, rollback, teardown, and estimates
are delivered with phase infrastructure tickets. Static hosting defaults to
retaining its versioned bucket on deletion; destructive cleanup is opt-in and
requires approval.

## Troubleshooting

- `npm ci` fails after resolving a workspace conflict: do not text-merge
  generated lockfile sections. Resolve the manifests, regenerate
  `package-lock.json`, and prove it with a clean `npm ci`.
- Playwright reports a missing browser: run `npx playwright install chromium`
  after `npm ci`.
- Codex prompts to authenticate: verify host `auth.json` exists or authenticate
  interactively inside the container.
- AWS commands use the wrong target: stop, inspect `aws sts
  get-caller-identity` and the configured region, and do not deploy until the
  account/region are explicitly approved.
- CI delivery is skipped: this is expected until deployment enablement,
  environment approval, and OIDC variables are configured.

## Contribution and evidence

Use Conventional Commits and reference one or more files under
`docs/tickets/`. Every handoff includes ticket IDs, branch and commit, commands
and results, changed contracts, documentation impact, risks, and follow-ups.
Only the coordinator marks a ticket `done` or merges it into
`zebanaya-kepler`.
