# ai-tic-tac-toe-lab

A browser-based Tic-Tac-Toe game built with React and TypeScript. The shipping player experience is still single-player in the browser, and the repo now also includes a Phase 2 multiplayer service scaffold with health/readiness endpoints for backend foundation work.

## Tech Stack

- React 18
- TypeScript 5
- Vite 7
- Node.js 20
- npm 10
- AWS CloudFormation for infrastructure provisioning
- AWS CLI v2 for deployment

## Architecture

- Single-page React application with two main views: a landing page and a gameplay page.
- Core game rules and state are centralized in [`src/shared/game.ts`](/workspaces/ai-tic-tac-toe-lab/src/shared/game.ts), which is shared by the browser app and the multiplayer service.
- The frontend continues to consume the shared game domain through [`src/game/Game.ts`](/workspaces/ai-tic-tac-toe-lab/src/game/Game.ts).
- CPU decision-making lives in [`src/game/cpu.ts`](/workspaces/ai-tic-tac-toe-lab/src/game/cpu.ts) and uses deterministic minimax scoring for repeatable move selection.
- The UI layer in [`src/App.tsx`](/workspaces/ai-tic-tac-toe-lab/src/App.tsx) renders the game, handles route-state navigation, and adds browser-only effects such as audio feedback and confetti.
- The Phase 2 backend foundation lives in [`server/index.ts`](/workspaces/ai-tic-tac-toe-lab/server/index.ts) as an Express service exposing `/health` and `/ready`.
- Production hosting uses an S3 static website provisioned from [`infra/s3-static-website.yaml`](/workspaces/ai-tic-tac-toe-lab/infra/s3-static-website.yaml).

## Run Locally

### Prerequisites

- Node.js 20
- npm 10

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Vite will print the local URL, typically `http://localhost:5173`.

### Start the multiplayer service scaffold

```bash
npm run server:start
```

The backend listens on `http://0.0.0.0:3001` by default and exposes:

- `GET /health`
- `GET /ready`

### Start frontend and backend together

```bash
npm run dev:full
```

This starts the Vite frontend and the backend scaffold in one terminal session.

### Build for production

```bash
npm run build
```

### Preview the production build locally

```bash
npm run preview
```

## Deploy to AWS

This project deploys as an S3 static website in two steps: provision the infrastructure, then upload the built app.

### Prerequisites

- AWS CLI v2 installed
- AWS credentials configured locally
- Access to an AWS account with permission to use CloudFormation and S3

Configure AWS if needed:

```bash
aws configure
```

The default region used by the scripts is `us-west-2`.

### 1. Provision the S3 website infrastructure

```bash
npm run aws:s3:setup
```

Default resources:

- Stack name: `ttt-ms-aj-s3-website`
- Bucket name: `ttt-ms-aj-tic-tac-toe-site`
- Region: `us-west-2`

Important: both the stack name and bucket name must include `ttt-ms-aj`.

Optional overrides:

```bash
BUCKET_NAME=ttt-ms-aj-your-unique-site \
STACK_NAME=ttt-ms-aj-s3-website-usw2 \
AWS_REGION=us-west-2 \
npm run aws:s3:setup
```

### 2. Build and deploy the app to S3

```bash
npm run aws:s3:deploy
```

This command:

- runs `npm run build`
- resolves the S3 bucket from the CloudFormation stack if `BUCKET_NAME` is not set
- syncs `dist/` to the website bucket with `--delete`

Optional overrides:

```bash
BUCKET_NAME=ttt-ms-aj-your-unique-site npm run aws:s3:deploy
```

```bash
STACK_NAME=ttt-ms-aj-s3-website-usw2 AWS_REGION=us-west-2 npm run aws:s3:deploy
```

### Deployment output

After deployment, the script prints the website URL in this format:

```text
http://<bucket-name>.s3-website-<region>.amazonaws.com
```

## Useful Scripts

- `npm run dev` - start the local development server
- `npm run dev:full` - start the local frontend and backend together
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run typecheck` - run TypeScript checks
- `npm run server:build` - compile the backend scaffold to `dist-server/`
- `npm run server:start` - build and start the backend scaffold locally
- `npm run aws:s3:setup` - create or update the S3 website infrastructure
- `npm run aws:s3:deploy` - build and deploy the app to S3
