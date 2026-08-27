# Application Agent Instructions

These instructions apply to product code below `apps/`. The repository root
`AGENTS.md` also applies.

## Responsibilities

- Build the Vite/React/TypeScript client and .NET 8 C# backend.
- Keep domain behavior deterministic and independently testable.
- Own root dependency changes and lockfile integration.
- Maintain the public contracts in `contracts/` after coordinator approval.
- Give QA stable seams: pure domain APIs, injectable clocks, deterministic IDs
  where needed, and replaceable persistence/broadcast interfaces.

## Client Rules

- Put pure local game state and CPU behavior in `packages/game-core`; do not
  hide rules in React components.
- Given the same board and configuration, the CPU must always choose the same
  legal move. Use and document a beatable strategy so a player-win acceptance
  scenario is possible.
- Disable illegal UI actions and also reject them in the domain layer.
- Make status text, valid-move feedback, quit, rematch, and multiplayer state
  explicit and accessible.
- Prefer generated Web Audio cues or clearly licensed local assets. Respect a
  mute control and reduced-motion preferences when adding celebration effects.
- Treat multiplayer state from the server as authoritative. Reconcile by event
  sequence and request catch-up after reconnecting.

## Server Rules

- Implement command handling in application/domain services rather than Lambda
  entry points.
- Validate game ID, player slot, turn, cell, lifecycle state, and command
  idempotency before accepting a move.
- Persist an ordered event before broadcasting it.
- Make join, resign, and abandonment transitions idempotent.
- Use server timestamps through an injectable clock for the three-minute
  abandonment rule.
- Enforce 25 active games with an atomic transaction/counter design.
- Remove stale WebSocket connections when delivery reports them gone.
- Do not rely on in-process memory for authoritative production state.

## Completion

Before handoff, run the relevant root verification commands, update the ticket,
and identify all contract changes. Feature code without tests requested from QA
and without documentation notes is incomplete.

