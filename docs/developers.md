# Developer Guide

## Overview
This project is a front-end tic-tac-toe application built with React, TypeScript, Vite, Zustand, ESLint, and Playwright.

The codebase is organized around two main responsibilities:

- `ui/src/game.ts`: pure game rules and derived game helpers
- `ui/src/store/gameSession.ts`: Zustand session state for the active game

`ui/src/App.tsx` is the main UI entry point. It owns landing-page form state locally and reads active game session state from the store.

## Core Architecture
### Domain module
`ui/src/game.ts` is the source of truth for game behavior.

It defines:

- domain types such as `Game`, `GameMode`, `GameState`, and `MoveRecord`
- move validation through `playMove`
- CPU orchestration helpers such as `chooseCpuMove`, `runCpuTurns`, and `playTurn`
- derived UI helpers such as `getStatus`, `getTerminalBanner`, `getMatchupLabel`, and `isCellDisabled`

Keep this file pure. It should not depend on React, Zustand, or browser APIs.

### Session store
`ui/src/store/gameSession.ts` manages the active session with Zustand.

It stores:

- `game`
- `playerName`
- `selectedMode`

It exposes actions:

- `startGame`
- `playCell`
- `newGame`
- `changeMode`
- `abandon`
- `resetSession`

The store should orchestrate the session by calling into `game.ts`. Do not duplicate rule logic in the store.

### UI layer
`ui/src/App.tsx` renders:

- the landing/setup screen
- the gameplay screen
- gameplay feedback such as confetti, sounds, and result messaging

The UI should consume store state and domain helpers rather than reimplementing game rules.

## Current Gameplay Behavior
- Supports `player-vs-player` and `player-vs-cpu`
- Randomizes starting player
- Randomizes CPU/human controller assignment in CPU mode
- Uses a deterministic CPU move order: `4, 0, 2, 6, 8, 1, 3, 5, 7`
- Tracks in-memory move history for the current game only
- Supports `active`, `won`, `draw`, and `abandoned` outcomes
- Allows `Quit game` to return to the landing screen
- Offers `Rematch` after finished CPU games

## Working Rules
- Check `docs/requirements.md` before changing gameplay behavior.
- Do not silently change documented game rules.
- Preserve the separation between pure rules, session orchestration, and rendering.
- If behavior changes, update tests and any affected docs in the same task.

## Common Commands
From `ui/`:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Implementation Notes
- UI audio feedback currently uses the Web Audio API. There are no bundled sound asset files.
- Confetti is implemented in CSS and rendered from the React UI.
- Invalid moves are prevented in the UI and rejected by the game rules.
- The landing-page name field accepts letters and numbers only, up to 24 characters.
