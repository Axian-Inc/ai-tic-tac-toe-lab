# AI Tic-Tac-Toe Lab

This repository is a simple Tic-Tac-Toe game with a CPU opponent, built as a small React + Redux learning lab.

## Structure

- `tic-tac-toe/` holds the app source and build tooling.
- `tic-tac-toe/src/pages/README.md` explains what lives in the pages folder.
- `tic-tac-toe/src/features/README.md` explains what lives in the features folder.

## Run Locally

```bash
cd tic-tac-toe
npm install
npm start
```

## Run Tests

```bash
cd tic-tac-toe
npm test -- --watchAll=false
```

## Run Playwright

```bash
cd tic-tac-toe
npm install
npx playwright install
npm run test:e2e
```

## Libraries

- `react` and `react-dom` for the UI.
- `react-router-dom` for routing between pages.
- `@reduxjs/toolkit` and `react-redux` for state management.
- `primereact` for UI components.
