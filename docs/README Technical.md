# Technical Documentation

## Tech Stack

### Frontend

-   React
-   TypeScript
-   Vite
-   canvas-confetti
-   HTML5 Audio API

### Testing

-   Unit: Vitest
-   E2E: Playwright

### Infrastructure

-   Terraform
-   AWS S3 (static hosting)
-   AWS CLI (authenticated to Axian LnD account)

## Architecture

UI (React Components) ↓ Game Module (Pure TypeScript) ↓ Deterministic
CPU Logic

The Game module is completely decoupled from React.

## Project Structure

/src /game /components /pages /hooks

/tests /terraform

## Testing Strategy

### Unit Tests

-   Board initialization
-   Valid/Invalid moves
-   Win detection
-   Draw detection
-   CPU determinism
-   Game reset

Run: npm run test

### Playwright E2E

Tests full deterministic game including win condition.

Run: `npm run test:e2e`

Container note:
- First-time setup: `npx playwright install`
- If browsers fail to launch in the container: `npx playwright install-deps`

## Deployment

Build app: npm run build

Provision infrastructure: terraform apply

Deploy: aws s3 sync dist/ s3://your-bucket-name
