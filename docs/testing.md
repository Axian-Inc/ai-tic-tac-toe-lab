# Testing Guide

This project uses three main validation layers:

- Frontend unit tests with Vitest
- Backend unit and handler tests with Vitest
- Browser end-to-end tests with Playwright

## Main Commands

Frontend unit tests:

```bash
npm test
```

Explicit frontend unit test command:

```bash
npm run test:unit
```

Backend tests:

```bash
npm run test:backend
```

End-to-end tests:

```bash
npm run test:e2e
```

Combined frontend unit plus end-to-end flow:

```bash
npm run test:all
```

PR-equivalent local validation:

```bash
npm run build
npm run build:backend
npm run test:unit:report
npm run test:backend:report
npm run coverage
```

## What Each Layer Covers

Frontend unit tests cover:

- Pure game-domain behavior under `tests/game`
- Multiplayer landing and game-page behavior under `tests/frontend`

Backend tests cover:

- Multiplayer domain rules
- HTTP handlers
- DynamoDB mappers and repositories
- WebSocket handler behavior

End-to-end tests currently cover:

- Local single-player browser flows through Playwright

## Coverage

Coverage commands:

```bash
npm run coverage:frontend
npm run coverage:backend
npm run coverage
```

Coverage output:

- `coverage/frontend/`
- `coverage/backend/`

Coverage currently includes the frontend and backend Vitest suites only. Playwright is part of validation, but it is not included in coverage reporting.

## CI Scope

The GitHub pull-request workflow currently runs:

- `npm run build`
- `npm run build:backend`
- `npm run test:unit:report`
- `npm run test:backend:report`
- `npm run coverage`

The PR workflow does not currently run Playwright end-to-end tests.

## Test Artifacts

JUnit output is written to:

- `test-results/frontend/junit.xml`
- `test-results/backend/junit.xml`

Coverage summaries are written to:

- `coverage/frontend/coverage-summary.json`
- `coverage/backend/coverage-summary.json`

## Known Practical Notes

- Run `npm run test:e2e:install` before Playwright for a fresh environment
- Playwright uses a local web server on `127.0.0.1:4173`
- `npm run test:all` is not the same as the PR workflow because it does not build, run backend-only report commands, or generate coverage
