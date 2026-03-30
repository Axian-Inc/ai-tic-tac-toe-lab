# Wrap Up

Repository URL: https://github.com/Axian-Inc/ai-tic-tac-toe-lab/tree/mgibson-axianld

## Basic App Structure

The application is split into two main parts:

- `tic-tac-toe/`: The frontend application, built with React and Redux. It contains the user interface, page-level flows, and client-side game state management.
- `api-server/`: The backend service, built as a Node-based HTTP API. It manages multiplayer game sessions and provides the server-side coordination used by the frontend.

The frontend communicates with the backend over HTTP and WebSocket connections to keep game state synchronized.

## Prerequisites

- Node.js 24 or newer is required to install dependencies and run the frontend and backend locally.

## Basic Commands

### Frontend

From the repository root:

```bash
cd tic-tac-toe
npm install
```

Build the frontend:

```bash
npm run build
```

Run frontend unit tests:

```bash
npm test -- --watchAll=false
```

Run frontend test coverage:

```bash
npm run test:coverage
```

Run the frontend TypeScript check:

```bash
npm run typecheck
```

### Backend

From the repository root:

```bash
cd api-server
npm install
```

Build the backend:

```bash
npm run build
```

Run backend unit tests:

```bash
npm test
```

Run backend test coverage:

```bash
npm run test:coverage
```

Run the backend TypeScript check:

```bash
npm run typecheck
```
