# ai-tic-tac-toe-lab

This repo now delivers a staged Tic Tac Toe system with:

- a local single-player React + TypeScript game with a deterministic CPU opponent
- a server-backed multiplayer flow over HTTP and WebSocket
- a spectator flow for discovering and watching active live matches
- terminal-runnable tests, coverage reporting, and pull request CI validation
- low-cost AWS deployment baselines for the frontend and multiplayer API

## Current Status

Phases 1, 2, and 3 are complete and accepted.

The app now supports:

- local single-player play against the deterministic CPU
- a multiplayer lobby for creating and joining waiting games
- a live multiplayer match screen backed by the HTTP API and WebSocket updates
- a spectator lobby for discovering and watching active multiplayer games

Phase 2 behavior is implemented across contract, API, realtime transport, client flow, server hardening, and deployment guidance. Phase 3 adds the spectator flow, terminal coverage reporting, and the pull request pipeline.

Phase completion state:

- Phase 1: complete and accepted
- Phase 2: complete and accepted
- Phase 3: complete and accepted

Current server-side hardening now includes:

- a `429` response once the concurrent multiplayer game cap of `25` is reached
- resignation rejection before a second player joins
- abandonment checks that reject invalid timestamps
- abandonment checks that return a no-op response when the timeout has not elapsed yet

Current spectator-facing server data now includes:

- `GET /games?status=active` for active-game discovery
- `GET /games/{id}` for a selected game's current state snapshot
- `WS /ws?gameId=...` for live updates and immediate resync snapshots

Current spectator UI behavior now includes:

- a `Spectate Live Games` entry point on the landing page
- an active-game list fed by `GET /games?status=active`
- a selected-game viewer that loads the current snapshot before opening live updates
- a read-only board that updates as players continue the match

## Prerequisites

For the app itself:

- Node.js `20.x`
- npm `11.x` or compatible

For local development in the intended lab environment:

- Docker Desktop
- VS Code with the Dev Containers extension
- a host install of OpenAI Codex CLI for auth bootstrapping into the container
- Axian GitHub access
- Axian AWS L&D credentials if you want to deploy the static-site baseline

## Getting Started

Install dependencies:

```bash
npm install
```

Start the app locally:

```bash
npm run dev -- --host 0.0.0.0
```

For multiplayer development, run the API server in a second terminal:

```bash
npm run start:server
```

If you are running inside the dev container, use the VS Code `Ports` panel to open the forwarded port in your host browser.

Build the production bundle:

```bash
npm run build
```

Preview the production bundle locally:

```bash
npm run preview -- --host 0.0.0.0
```

## Available Scripts

- `npm run dev`: start the Vite development server
- `npm run dev:server`: run the multiplayer API in watch mode
- `npm run build`: typecheck and produce the production bundle in `dist/`
- `npm run preview`: serve the built bundle locally
- `npm run start:server`: start the multiplayer API once
- `npm run typecheck`: run the TypeScript compiler in no-emit mode
- `npm run test:unit`: run Vitest game-domain coverage
- `npm run test:server`: run the multiplayer HTTP API tests
- `npm run test:e2e`: run the Playwright browser flows for single-player, multiplayer, and spectator paths
- `npm run coverage`: generate terminal coverage output plus HTML and JSON summary reports in `coverage/`
- `npm test`: run unit, server, and e2e coverage
- `npm run deploy:static`: deploy the static-site baseline described in `infra/`
- `npm run package:server`: create a deployable multiplayer API artifact tarball
- `npm run deploy:server`: upload and deploy the multiplayer API baseline described in `infra/`

## Pull Request Pipeline

Phase 3 adds a GitHub Actions pull request workflow at `.github/workflows/pull-request.yml`.

On every pull request it currently runs:

- `npm ci`
- `npm run build`
- `npm run test:unit`
- `npm run test:server`
- `npm run coverage`
- `npm run package:server`

## Phase 3 Review Commands

These are the main terminal commands that represent the final Phase 3 validation surface:

- `npm run build`
- `npm run test:unit`
- `npm run test:server`
- `npm run test:e2e`
- `npm run coverage`
- `npm run package:server`

## Gameplay Notes

- The human player is always `X`.
- The CPU is always `O`.
- CPU moves are deterministic, so the same board state will always produce the same CPU move.
- Hover states and blocked-cell styling communicate which moves are available.
- Invalid clicks produce feedback instead of silently failing.
- Winning, losing, drawing, and move placement all produce lightweight browser-generated tones.

## Testing

Run the full automated suite:

```bash
npm test
```

Run only unit tests:

```bash
npm run test:unit
```

Run only the browser flow:

```bash
npm run test:e2e
```

Generate coverage from the terminal:

```bash
npm run coverage
```

Notes:

- The Playwright suite auto-starts isolated Vite and API server instances through `playwright.config.ts`.
- In this dev container, Chromium system libraries were installed so Playwright can run headless.
- The coverage run writes reports to `coverage/`, including an HTML report and `coverage-summary.json`.

## Documentation Map

- [AGENTS.md](/workspaces/ai-tic-tac-toe-lab/AGENTS.md): working rules and phase discipline for agents
- [WorkTracker.md](/workspaces/ai-tic-tac-toe-lab/WorkTracker.md): epic/story tracking
- [LD-WorkLog.md](/workspaces/ai-tic-tac-toe-lab/LD-WorkLog.md): detailed running work log
- [docs/architecture.md](/workspaces/ai-tic-tac-toe-lab/docs/architecture.md): application architecture and flow
- [docs/multiplayer-architecture.md](/workspaces/ai-tic-tac-toe-lab/docs/multiplayer-architecture.md): multiplayer server/client transport and contract notes
- [docs/project-organization.md](/workspaces/ai-tic-tac-toe-lab/docs/project-organization.md): source layout and ownership
- [infra/README.md](/workspaces/ai-tic-tac-toe-lab/infra/README.md): Phase 1 static-site deployment baseline
- [phases/phase-1/phase-1.md](/workspaces/ai-tic-tac-toe-lab/phases/phase-1/phase-1.md): Phase 1 requirements

## Deployment Baseline

Phase 1 uses a low-cost static hosting baseline:

- build the Vite app into `dist/`
- provision an S3 website bucket with CloudFormation
- sync the built assets into the bucket with AWS CLI

Phase 2 adds a low-cost multiplayer API baseline:

- package the server runtime into a tarball
- upload the artifact to S3
- provision a single EC2-based API host with CloudFormation
- run the multiplayer API under `systemd`

See [infra/README.md](/workspaces/ai-tic-tac-toe-lab/infra/README.md) for the deployment flow and [infra/cloudformation/static-site.yml](/workspaces/ai-tic-tac-toe-lab/infra/cloudformation/static-site.yml) for the baseline template.

## Architecture Summary

At the moment the application is intentionally simple:

- `src/app/App.tsx` coordinates the screen flow and CPU turn timing
- `src/features/multiplayer/api.ts` owns both player and spectator browser calls
- `shared/contracts/multiplayer.ts` defines the Phase 2 multiplayer DTO and event baseline
- `server/` now contains the multiplayer HTTP and WebSocket server
- `src/features/game/model/` contains the pure game logic
- `src/pages/` contains the landing, lobby, single-player, multiplayer, and spectator screens
- `src/features/game/components/BoardPreview.tsx` renders the board UI
- `tests/unit/` covers the game domain
- `tests/server/` covers the multiplayer backend
- `tests/e2e/` covers the browser flow

More detail is in [docs/architecture.md](/workspaces/ai-tic-tac-toe-lab/docs/architecture.md).
