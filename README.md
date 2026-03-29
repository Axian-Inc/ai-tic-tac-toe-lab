# ai-tic-tac-toe-lab

## Project Overview

This project is a browser-based Tic Tac Toe app built as a small lab for modern frontend, game-domain, testing, and deployment workflows. The current app lets the player compete as `X` against a deterministic CPU opponent as `O`, with the game rules implemented in a pure TypeScript domain layer and the UI rendered with React.

The repository is structured so the game rules stay framework-agnostic, the UI remains thin, and the project can grow into an AWS-hosted deployment backed by Terraform-managed infrastructure.

With PR gates

## Tech Stack

- React 19
- TypeScript 5
- Vite 7
- React Router 7
- Vitest for unit tests
- Playwright for end-to-end tests
- Terraform for future AWS infrastructure provisioning

## Install Dependencies

Install project dependencies:

```bash
npm install
```

Install Playwright browsers and Linux runtime dependencies for end-to-end testing:

```bash
npm run test:e2e:install
```

## Run Locally

Start the Vite development server:

```bash
npm run dev
```

The app serves on `0.0.0.0:5173` so it works in local browsers, forwarded ports, and remote workspace previews.

Build the production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The preview server serves on `0.0.0.0:4173`.

## Run Tests

Run unit tests:

```bash
npm test
```

Or explicitly:

```bash
npm run test:unit
```

Run Playwright end-to-end tests:

```bash
npm run test:e2e
```

Run the full CI-style test workflow:

```bash
npm run test:all
```

Test locations:

- Frontend and shared Vitest tests: `tests/`
- Backend Vitest tests: `backend/tests`
- End-to-end tests: `tests/e2e`

## Coverage Reports

Generate frontend coverage from the root Vitest suite:

```bash
npm run coverage:frontend
```

Generate backend coverage from the backend Vitest suite:

```bash
npm run coverage:backend
```

Generate both reports in one pass:

```bash
npm run coverage
```

Coverage output locations:

- Frontend HTML report: `coverage/frontend/index.html`
- Backend HTML report: `coverage/backend/index.html`
- Frontend machine-readable summary: `coverage/frontend/coverage-summary.json`
- Backend machine-readable summary: `coverage/backend/coverage-summary.json`

Notes:

- Coverage currently includes the frontend and backend Vitest suites only.
- Playwright end-to-end tests are part of validation, but they are not included in coverage generation.
- Each coverage run overwrites the prior report in its output directory.

## Pull Request Checks

GitHub Actions runs a pull-request workflow for this repository.

The PR workflow currently validates:

- Frontend build with `npm run build`
- Backend build with `npm run build:backend`
- Frontend unit tests with `npm run test:unit:report`
- Backend unit tests with `npm run test:backend:report`
- Frontend and backend coverage with `npm run coverage`

Artifacts and results:

- Unit test results are published to the PR check via JUnit output.
- Coverage artifacts are uploaded from `coverage/frontend/` and `coverage/backend/`.
- Raw JUnit XML is uploaded from `test-results/`.

Equivalent local commands:

```bash
npm run build
npm run build:backend
npm run test:unit:report
npm run test:backend:report
npm run coverage
```

## Architecture Overview

The app is intentionally split into a few simple layers:

- `src/game`
  Pure TypeScript game domain logic, including state, legal moves, winner detection, and deterministic CPU behavior.
- `src/hooks`
  React orchestration for game sessions, CPU timing, and one-shot UI effects like sounds and confetti.
- `src/components`
  Reusable presentational UI pieces for the board, status area, action bar, and overlays.
- `src/routes`
  Route-level page composition for the landing page and game detail page.
- `tests`
  Unit and browser tests that validate both the pure domain behavior and the real user flow.

The React UI reads from the game state returned by the domain layer and dispatches moves back into it. The rules themselves do not live in components.

At the infrastructure layer, the app now uses a private S3 origin behind CloudFront for the frontend plus a serverless multiplayer backend on AWS. That keeps the frontend globally cached while adding low-cost HTTP and WebSocket infrastructure for live multiplayer play.

## Game Module

The game domain lives under `src/game` and is the source of truth for Tic Tac Toe rules.

Core responsibilities:

- Represent the 3x3 board
- Track move history in order
- Determine whose turn it is
- Reject illegal moves
- Detect wins and draws
- Expose legal move information to the UI
- Support deterministic CPU decision-making through pure inputs and outputs

Key files:

- `src/game/types.ts`
  Defines `Player`, `CellValue`, `Move`, `Board`, `GameStatus`, and `GameState`
- `src/game/gameEngine.ts`
  Exposes pure helpers such as `createGame`, `applyMove`, `getLegalMoves`, `getWinner`, `isGameOver`, `getCurrentPlayer`, and `getMoveHistory`
- `src/game/cpu.ts`
  Exposes `chooseCpuMove(gameState)` for deterministic CPU play

Because this layer is pure and React-independent, it is easy to test and safe to reuse in any future client, server, or multiplayer implementation.

## Deterministic CPU Behavior

The CPU opponent is intentionally deterministic. Given the same board state, it always returns the same move.

Its explicit priority order is:

1. Take a winning move if one exists
2. Block the opponent's immediate winning move
3. Take the center square
4. Take the first available corner in fixed order: `0, 2, 6, 8`
5. Take the first available edge in fixed order: `1, 3, 5, 7`

This makes the CPU:

- Predictable for testing
- Stable for CI automation
- Easy to reason about during debugging
- Simple to evolve later if a stronger strategy is needed

## Deployment Overview For AWS

The deployed AWS footprint is:

- S3 stores the built frontend assets in a private bucket
- CloudFront serves the app globally over HTTPS and caches static content
- API Gateway HTTP routes accept multiplayer requests
- Lambda functions validate commands and broker multiplayer state changes
- DynamoDB stores game snapshots, ordered event history, and WebSocket connection metadata
- API Gateway WebSocket routes deliver live updates to players and spectators
- Route53 can be attached later through Terraform inputs if you want a custom domain
- All named resources are prefixed with `jltlnd-` by default so they are easy to find and less likely to collide in a shared AWS account

Infrastructure description:

```text
Browser
  -> CloudFront distribution
    -> private S3 frontend origin
  -> API Gateway HTTP API
    -> Lambda handlers
      -> DynamoDB
  -> API Gateway WebSocket API
    -> Lambda handlers
      -> DynamoDB
```

The intended deployment flow is:

1. Build the backend package with `npm run build:backend`
2. Initialize and apply Terraform in the target environment
3. Read the deployed backend HTTP and WebSocket URLs from Terraform outputs
4. Build the frontend with `VITE_MULTIPLAYER_API_BASE_URL` and `VITE_MULTIPLAYER_WS_URL`
5. Upload the generated `dist/` assets to the private S3 bucket
6. Invalidate CloudFront

## Terraform Usage Overview

Terraform is organized so the root module describes the reusable stack and environment directories provide concrete inputs.

Current layout:

```text
terraform/
  versions.tf
  providers.tf
  variables.tf
  main.tf
  outputs.tf
  modules/
    frontend_delivery/
      main.tf
      variables.tf
      outputs.tf
  environments/
    dev/
      main.tf
      variables.tf
      outputs.tf
      terraform.tfvars.example
```

How the layout works:

- `terraform/`
  Root reusable stack that composes the infrastructure modules
- `terraform/modules/frontend_delivery`
  Frontend hosting module with private S3, CloudFront, and optional Route53 aliases
- `terraform/modules/multiplayer_backend`
  Multiplayer backend module with DynamoDB, Lambda, API Gateway HTTP routes, and API Gateway WebSocket routes
- `terraform/environments/dev`
  A concrete environment entrypoint that calls the reusable stack with development settings

Recommended Terraform workflow:

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform workspace new jlt
terraform workspace select jlt
terraform plan
terraform apply
```

Workspace requirement:

- This environment is intentionally guarded to require the named Terraform workspace `jlt`
- The `default` workspace is not allowed
- If `jlt` already exists, run only `terraform workspace select jlt`

Useful outputs after apply:

- Frontend S3 bucket name
- CloudFront distribution ID
- CloudFront domain name
- Backend HTTP API URL
- Backend WebSocket URL

Deploy the full stack:

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform workspace select jlt
terraform apply

export VITE_MULTIPLAYER_API_BASE_URL="$(terraform output -raw backend_http_api_url)"
export VITE_MULTIPLAYER_WS_URL="$(terraform output -raw backend_websocket_api_url)"
export FRONTEND_BUCKET_NAME="$(terraform output -raw frontend_bucket_name)"
export FRONTEND_DISTRIBUTION_ID="$(terraform output -raw frontend_distribution_id)"

cd ../../
npm run build:backend
VITE_MULTIPLAYER_API_BASE_URL="$VITE_MULTIPLAYER_API_BASE_URL" \
VITE_MULTIPLAYER_WS_URL="$VITE_MULTIPLAYER_WS_URL" \
  npm run build
aws s3 sync dist "s3://$FRONTEND_BUCKET_NAME" --delete
aws cloudfront create-invalidation --distribution-id "$FRONTEND_DISTRIBUTION_ID" --paths "/*"
```

With the default `dev` example inputs, the frontend bucket will be named like:

```text
jltlnd-tic-tac-toe-lab-dev-frontend
```

Notes on HTTPS and custom domains:

- If you do not supply a custom domain, the app is still served over HTTPS through the default CloudFront domain
- If you want a custom domain, provide `domain_aliases` and an ACM certificate ARN from `us-east-1`
- Route53 records can be created by Terraform when `create_route53_records = true`

## Dev Container Setup Instructions

### Prerequisites

This lab is intended to run inside a Docker-based VS Code Dev Container.

- Docker Desktop
- VS Code with the Dev Containers extension
- A local install of OpenAI Codex CLI
  Example: `brew install codex` or `npm install -g @openai/codex`
- Axian GitHub account access
- Axian AWS L&D access key for AWS CLI work

### Prep

- Generate or obtain your AWS L&D access key
- Run `codex` locally and complete login through the web UI

### Clone And Create Personal Branch

Clone the repo:

```bash
git clone https://github.com/Axian-Inc/ai-tic-tac-toe-lab.git
```

Checkout the starter branch:

```bash
git checkout 00-devcontainer-starter
```

Create your working branch:

```bash
git checkout -b <firstname-last initial>-<your-branch-name>
```

### Open In Dev Container

- Open the folder in VS Code
- Reopen it in the Dev Container when prompted
- Wait for the container build to finish
- The setup copies local Codex auth into the container

### Verify Codex Auth

- Open a terminal inside the Dev Container
- Run `codex`
- Use `/status` to verify the expected account is active

### AWS Setup

Run:

```bash
aws configure
```

Suggested values:

- Region: `us-west-2`
- Output: `json` or blank

Validate with:

```bash
aws s3 ls
```

### GitHub Setup

Validate Git access:

```bash
git ls-remote origin
```

Set your Git identity if needed:

```bash
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```
