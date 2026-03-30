# AI Tic-Tac-Toe Lab 

This repository now contains:

- `tic-tac-toe/`: React + Redux frontend for multiplayer tic-tac-toe.
- `api-server/`: Node HTTP API for multiplayer game sessions.

The frontend coordinates game state through the API server (HTTP + WebSocket).

## Run Locally

```bash
cd api-server
npm install
npm run dev

cd ../tic-tac-toe
npm install
npm start
```

For a production-style API run:

```bash
cd api-server
npm run build
npm start
```

Optional frontend config:

```bash
REACT_APP_API_BASE_URL=http://localhost:4000 npm start
```

Optional websocket override:

```bash
REACT_APP_WS_BASE_URL=http://localhost:4000 npm start
```

## Frontend: Run Unit Tests

```bash
cd tic-tac-toe
npm test -- --watchAll=false
```

## Frontend: Coverage Report

```bash
cd tic-tac-toe
npm run test:coverage
```

## Frontend: TypeScript Check

```bash
cd tic-tac-toe
npm run typecheck
```

## Frontend: Run Playwright

```bash
cd tic-tac-toe
npm install
npx playwright install
npm run test:e2e
```

## API Server: Run Tests

```bash
cd api-server
npm test
```

## Frontend Libraries

- `react` and `react-dom` for the UI.
- `react-router-dom` for routing between pages.
- `@reduxjs/toolkit` and `react-redux` for state management.
- `primereact` for UI components.
