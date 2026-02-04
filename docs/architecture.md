# Architecture Overview

## Frontend
- React + TypeScript + Vite.
- Routes: Landing (`/`) and Game (`/game`).
- State: `Game` module for domain logic; `CpuGame` for CPU flow.

## Domain layer
- `src/game/Game.ts`: core state/logic, no React dependencies.
- `src/game/cpu.ts`: deterministic CPU strategy.
- `src/game/CpuGame.ts`: CPU orchestration wrapper.

## Testing
- Unit tests: `scripts/test-game.ts` (pure logic).
- Integration tests: `scripts/test-integration.tsx` (jsdom + RTL).
- E2E: Playwright tests in `e2e/`.

## Deployment
- Static build artifacts in `dist/`.
- Terraform: S3 + CloudFront.
- Deploy script: `scripts/deploy-aws.sh`.
