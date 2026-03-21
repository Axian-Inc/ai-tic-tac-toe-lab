# Project Setup

## File Index

This file explains how to get the app running locally after a fresh clone.
It lists prerequisites and optional tooling for local development.
It covers dependency installation and how to start the Vite dev server.
It documents the most common local commands for tests, linting, build, and preview.
It also notes that AWS and Terraform are not required for local app development.

## Content

Date: 2026-03-19

Use this file when setting up the app locally for the first time after cloning the repository.

## Prerequisites

- Node.js 20 or newer recommended.
- npm (comes with Node.js).
- Git.

Optional tools:

- Playwright browser binaries for E2E tests: `npx playwright install`
- Terraform and AWS CLI if you also need infrastructure or deployment workflows.

## First-Time Setup

1. Clone the repository.
2. Change into the project directory.
3. Install dependencies:

```bash
npm install
```

## Run the App Locally

Start the Vite development server:

```bash
npm run dev
```

Default local URL:

```text
http://127.0.0.1:5173
```

If you need the dev server reachable on all interfaces, use:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

Start the multiplayer API server (separate process):

```bash
npm run server
```

Default server URL:

```text
http://localhost:5174
```

## Common Local Commands

Run unit tests once:

```bash
npm run test:run
```

Run unit tests in watch mode:

```bash
npm test
```

Run Playwright E2E tests:

```bash
npm run test:e2e
```

If Playwright browsers are not installed yet:

```bash
npx playwright install
```

Run linting:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Notes

- The app is a Vite + React + TypeScript project.
- No environment variables are required to run the app locally.
- `npm run test:e2e` starts or reuses a local Vite server automatically through Playwright config.
- AWS, Terraform, and S3 deployment are not required for local development.
