# ai-tic-tac-toe-lab

## Setup and run

Requires Node.js 22+ (see `.nvmrc`).

```bash
npm install
npm run dev -- --host
```

Other useful scripts:

```bash
npm run build
npm run lint
npm run test:game
npm run test:unit
npm run coverage
npm run test:e2e
npm test
npm run deploy:aws
```

## Phase 2 local dev (planned)

This repo currently ships a single-player, client-only app. Phase 2 adds a
server for multiplayer (HTTP + WebSocket). Planned local workflow:

```bash
# client
npm run dev -- --host

# server (placeholder)
npm run dev:server
```

## Multiplayer overview (planned)

- HTTP endpoints: create/join games and fetch initial state.
- WebSocket channel: real-time moves, state updates, resign/abandon events.
- Server is authoritative for turn order and legality.
- Server tech: Node.js + TypeScript + Express (see `server/`).
- Leave vs Resign: Leave exits the multiplayer view and disconnects the socket without ending the game. Resign ends the game and declares the other player the winner.
- Multiplayer rematch: Rematch creates a new room and provides an invite link for the opponent to join.
- IaC: Terraform provisions a low-cost ECS Fargate service (256 CPU / 512 MB) behind an ALB for the multiplayer server. CloudFront also routes `/games`, `/ws`, and `/health` to the server so the client can use the same HTTPS origin.
- Container image: `server/Dockerfile` builds the multiplayer server. Terraform creates an ECR repo (`server_ecr_repository_url`) for publishing the image.
- Persistence: Game records are stored in DynamoDB (`server_games_table_name`) so history survives restarts.
- CORS: Server accepts origins listed in `CORS_ORIGINS` (set by Terraform to the CloudFront domain + localhost).

## Architecture overview

- UI: Vite + React + TypeScript, with routes in `src/App.tsx`.
- Domain: Pure game logic lives under `src/game` (no React imports).
- Gameplay: `CpuGame` wraps the `Game` domain to auto-apply CPU moves.
- Pages: `src/pages/LandingPage.tsx` and `src/pages/GamePage.tsx`.
- Spectate: visit `/spectate` to browse active games, then `/spectate/:gameId` to watch a live game.

## CPU strategy

The CPU is deterministic and always chooses the same move for the same board.
Strategy order: win > block > center > corner > side. Implemented in
`src/game/cpu.ts`.

## Testing approach

- Unit tests cover the pure Game module logic (state, move legality, wins/draws).
  Run via `npm run test:game` or `npm run test:unit` (uses `tsx`).
- Coverage: `npm run coverage` generates a console summary and HTML report in
  `coverage/`. Thresholds are defined in `.c8rc.json` (currently 85% statements/lines,
  70% branches, 70% functions).
- Integration tests: `npm run test:integration`.
- Server tests: `npm run test:server` (starts the server in test mode and exercises HTTP/WS behaviors).
- Playwright E2E tests cover full user flows including game completion and
  human win verification. Run via `npm run test:e2e`.
  Note: running `npx playwright test` directly expects `npm run build` to have been run.
- CI guidance: Playwright runs headless and starts a Vite preview server via
  the Playwright `webServer` config (build + `npm run preview`).
- Determinism: CPU strategy is deterministic, and tests can opt into
  `cpu=off` query param to drive both players when needed.
- Deploy uses `scripts/deploy-aws.sh` to sync to S3 with metadata and invalidate
  CloudFront.

Test strategy notes:
- Unit tests: fast, deterministic checks for the `src/game` logic (pure functions and state).
- Server tests: exercise HTTP + WebSocket behaviors end-to-end against the local server.
- E2E tests: cover critical UI flows across pages; keep these higher-level and fewer in number.
- Coverage: only measures the unit-test run (`npm run test:unit`), so coverage numbers do not include server or Playwright tests.

## CI

Minimal pipeline order:
```bash
npm run test:unit
npm run coverage
npm run test:server
npm run test:e2e
```

Required environment variables for tests:
- `CI` (optional): When set, Playwright will not reuse an existing preview server.
- PR workflow uses the Node version defined in `.nvmrc`.
  E2E runs in PRs; if flakiness becomes an issue, move E2E to a nightly workflow.

GitHub Actions PR workflow summary:
- Triggers on pull requests.
- Installs dependencies with `npm ci`.
- Builds client and server.
- Runs unit tests, coverage, and Playwright E2E.
- Uploads `coverage/` as a workflow artifact.

## Deployment

Prerequisites:
- Node.js 22+ (see `.nvmrc`).
- AWS credentials configured (env vars or `aws configure`).
- Terraform installed (>= 1.5).

Terraform workflow:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

Phase 2 (planned):
- Provision server-side resources (compute + WebSocket endpoint).
- Extend Terraform to include API + WS resources and deployment steps.

Application deployment (frontend):
```bash
npm run build
npm run deploy:aws
```

Server deployment (backend):
```bash
npm run deploy:server
```

Combined deploy (frontend + backend):
```bash
VITE_API_BASE="https://$(terraform -chdir=terraform output -raw cloudfront_domain_name)" npm run deploy:all
```

CloudFront invalidation:
```bash
aws cloudfront create-invalidation --distribution-id <distribution-id> --paths '/*'
```

Teardown:
```bash
cd terraform
terraform destroy
```

Common pitfalls:
- CloudFront requires ACM certificates in `us-east-1` if you add a custom domain.
- Bucket and distribution names must be globally unique; adjust `terraform/terraform.tfvars` if needed.
- Client needs `VITE_API_BASE` set to the CloudFront HTTPS origin to avoid mixed-content errors.

## Key design decisions

- Keep domain logic isolated from React for testability and reuse.
- Use a deterministic CPU strategy for predictable behavior and easy tests.
- Encode player roles via query params (`/game?human=X&cpu=O`) so navigation
  communicates intent without global state.
- Provide lightweight audio/confetti effects without external dependencies.
- CloudFront is configured to serve `/index.html` for 403/404 errors so SPA
  deep links and refreshes work as expected.
- CloudFront caching: HTML defaults to a short TTL (60s, max 300s) to prevent
  stale app shells, while hashed assets under `/assets/*` use a long TTL
  (1 year) for performance.
