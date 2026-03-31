# ai-tic-tac-toe-lab

Phase 1 currently delivers a local-first Tic Tac Toe app in React + TypeScript with:

- a deterministic CPU opponent
- a reusable game domain module
- a landing page and playable single-player flow
- move feedback, illegal-move messaging, and win/loss/draw celebration cues
- terminal-runnable unit and end-to-end tests
- a low-cost AWS static-site deployment baseline

## Current Status

Phase 1 is complete. Story `2.4` is the active Phase 2 milestone and adds the first visible multiplayer client flow.

The app now supports:

- local single-player play against the deterministic CPU
- a multiplayer lobby for creating and joining waiting games
- a live multiplayer match screen backed by the HTTP API and WebSocket updates

Resign, abandonment-focused UX, concurrency-limit UX, and infrastructure expansion are still tracked in later Phase 2 stories.

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
- `npm run test:e2e`: run the Playwright single-player browser flow
- `npm test`: run unit, server, and e2e coverage
- `npm run deploy:static`: deploy the static-site baseline described in `infra/`

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

Notes:

- The Playwright suite auto-starts the Vite app through `playwright.config.ts`.
- In this dev container, Chromium system libraries were installed so Playwright can run headless.

## Documentation Map

- [AGENTS.md](/workspaces/ai-tic-tac-toe-lab/AGENTS.md): working rules and phase discipline for agents
- [WorkTracker.md](/workspaces/ai-tic-tac-toe-lab/WorkTracker.md): epic/story tracking
- [LD-WorkLog.md](/workspaces/ai-tic-tac-toe-lab/LD-WorkLog.md): detailed running work log
- [docs/architecture.md](/workspaces/ai-tic-tac-toe-lab/docs/architecture.md): application architecture and flow
- [docs/multiplayer-architecture.md](/workspaces/ai-tic-tac-toe-lab/docs/multiplayer-architecture.md): Phase 2 server/client contract baseline
- [docs/project-organization.md](/workspaces/ai-tic-tac-toe-lab/docs/project-organization.md): source layout and ownership
- [infra/README.md](/workspaces/ai-tic-tac-toe-lab/infra/README.md): Phase 1 static-site deployment baseline
- [phases/phase-1/phase-1.md](/workspaces/ai-tic-tac-toe-lab/phases/phase-1/phase-1.md): Phase 1 requirements

## Deployment Baseline

Phase 1 uses a low-cost static hosting baseline:

- build the Vite app into `dist/`
- provision an S3 website bucket with CloudFormation
- sync the built assets into the bucket with AWS CLI

See [infra/README.md](/workspaces/ai-tic-tac-toe-lab/infra/README.md) for the deployment flow and [infra/cloudformation/static-site.yml](/workspaces/ai-tic-tac-toe-lab/infra/cloudformation/static-site.yml) for the baseline template.

## Architecture Summary

At the moment the application is intentionally simple:

- `src/app/App.tsx` coordinates the screen flow and CPU turn timing
- `shared/contracts/multiplayer.ts` defines the Phase 2 multiplayer DTO and event baseline
- `server/` now contains the multiplayer HTTP and WebSocket server
- `src/features/game/model/` contains the pure game logic
- `src/pages/` contains the landing, lobby, single-player, and multiplayer screens
- `src/features/game/components/BoardPreview.tsx` renders the board UI
- `tests/unit/` covers the game domain
- `tests/server/` covers the multiplayer backend
- `tests/e2e/` covers the browser flow

More detail is in [docs/architecture.md](/workspaces/ai-tic-tac-toe-lab/docs/architecture.md).
