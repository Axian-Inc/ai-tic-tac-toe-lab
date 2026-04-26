# Tester Guide

## Purpose
This document describes what to verify when testing the tic-tac-toe application and how the current test suite is organized.

## What To Test
### Setup and navigation
- Landing page loads first
- Player name is required
- Player name accepts only letters and numbers
- Player name is limited to 24 characters
- User can start either `player-vs-player` or `player-vs-cpu`
- `Quit game` returns the player to the landing page

### Core gameplay
- Board has 9 cells
- Only valid moves are accepted
- Occupied cells cannot be played again
- Turn order updates correctly
- Winning lines are detected
- Draws are detected
- Post-game moves are blocked
- Mode changes replace the current game with a fresh one

### CPU mode
- Exactly one mark is human-controlled and one is CPU-controlled
- CPU responds immediately after a valid human move
- CPU opening move happens immediately when the CPU starts
- CPU move selection is deterministic from the same board state
- Human interaction is blocked during CPU turns
- CPU games show player-facing result text such as `You win`, `You lose`, and `Draw`
- Finished CPU games show a `Rematch` option

### Gameplay feedback
- Winning games show confetti
- Winning games trigger the winning feedback path
- Losing games show `Try again` feedback
- The board gives visual cues for playable, occupied, and locked cells
- X and O remain visually distinct

## Automated Test Coverage
The current Playwright suite lives in `ui/tests`.

Main test groups:

- `app.spec.ts`: end-to-end UI flow and user-facing behavior
- `game.spec.ts`: pure game-engine behavior
- `game-session.spec.ts`: Zustand session-store behavior

## Test Commands
From `ui/`:

```bash
npm run lint
npm test
```

Optional:

```bash
npm run test:headed
npm run build
```

## Manual Test Checklist
### Player vs Player
1. Start a PvP game with a valid name.
2. Confirm the matchup label uses `<name> vs <name>`.
3. Play a normal game and verify turn changes.
4. Finish a game with a win and verify result text.
5. Start a new game and confirm the board and history reset.

### Player vs CPU
1. Start a CPU game with a valid name.
2. Confirm the matchup label uses `<name> vs CPU`.
3. Make a move and confirm the CPU replies immediately.
4. Finish a CPU loss and verify `You lose`, `Try again`, and `Rematch`.
5. Finish a CPU win and verify celebratory feedback.
6. Click `Rematch` and confirm a fresh CPU game starts.

### Quit flow
1. Start any game.
2. Click `Quit game`.
3. Confirm the landing page returns and the name field is empty.

## Reporting Guidance
When filing a bug, include:

- mode used
- exact move sequence if relevant
- expected result
- actual result
- whether the issue is reproducible
- screenshots or video for UI/animation problems
