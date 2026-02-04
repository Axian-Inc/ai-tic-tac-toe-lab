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

## Architecture overview

- UI: Vite + React + TypeScript, with routes in `src/App.tsx`.
- Domain: Pure game logic lives under `src/game` (no React imports).
- Gameplay: `CpuGame` wraps the `Game` domain to auto-apply CPU moves.
- Pages: `src/pages/LandingPage.tsx` and `src/pages/GamePage.tsx`.

## CPU strategy

The CPU is deterministic and always chooses the same move for the same board.
Strategy order: win > block > center > corner > side. Implemented in
`src/game/cpu.ts`.

## Testing approach

- Unit tests cover the pure Game module logic (state, move legality, wins/draws).
  Run via `npm run test:game` or `npm run test:unit` (uses `tsx`).
- Integration tests: `npm run test:integration`.
- Playwright E2E tests cover full user flows including game completion and
  human win verification. Run via `npm run test:e2e`.
- CI guidance: Playwright runs headless and starts a Vite preview server via
  the Playwright `webServer` config (build + `npm run preview`).
- Determinism: CPU strategy is deterministic, and tests can opt into
  `cpu=off` query param to drive both players when needed.
- Deploy uses `scripts/deploy-aws.sh` to sync to S3 with metadata and invalidate
  CloudFront.

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

Application deployment:
```bash
npm run build
npm run deploy:aws
```

CloudFront invalidation:
```bash
aws cloudfront create-invalidation --distribution-id E2OIVQ7L1EG91H --paths '/*'
```

Teardown:
```bash
cd terraform
terraform destroy
```

Common pitfalls:
- CloudFront requires ACM certificates in `us-east-1` if you add a custom domain.
- Bucket and distribution names must be globally unique; adjust `terraform/terraform.tfvars` if needed.

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
