# ai-tic-tac-toe-lab

## Setup and run

```bash
npm install
npm run dev -- --host
```

Other useful scripts:

```bash
npm run build
npm run lint
npm run test:game
```

## Architecture overview

- UI: Vite + React + TypeScript, with routes in `src/App.tsx`.
- Domain: Pure game logic lives under `src/game` (no React imports).
- Gameplay: `CpuGame` wraps the `Game` domain to auto-apply CPU moves.
- Pages: `src/pages/LandingPage.tsx` and `src/pages/GamePage.tsx`.

## CPU strategy

The CPU is deterministic and always chooses the same move for the same board.
Strategy order: win > block > center > corner > side. Implemented in
`src/game/cpu.ts`.

## Testing approach

- Pure unit-style tests in `scripts/test-game.ts`.
- Run via `npm run test:game` (uses `tsx`).

## Key design decisions

- Keep domain logic isolated from React for testability and reuse.
- Use a deterministic CPU strategy for predictable behavior and easy tests.
- Encode player roles via query params (`/game?human=X&cpu=O`) so navigation
  communicates intent without global state.
- Provide lightweight audio/confetti effects without external dependencies.
