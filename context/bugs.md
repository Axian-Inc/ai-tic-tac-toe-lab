# Bugs

Last updated: 2026-03-16

This file tracks active and resolved product defects discovered during development and testing.

## Phase 1

### Active

- None.

### Resolved

#### BUG-003 Play Again Visible Before Game Over
- Reported: 2026-03-01
- Resolved: 2026-03-01
- Related stories: US-09, US-14
- Root cause: Gameplay controls always rendered the `Play Again` button without checking game status.
- Resolution: Updated gameplay controls to render `Play Again` only when `gameState.status.isOver` is true.

#### BUG-002 CPU Does Not Select Winning-Path Moves
- Reported: 2026-03-01
- Resolved: 2026-03-01
- Related stories: US-05, US-15
- Root cause: CPU move selection returned the first valid open cell, which ignored winning opportunities and defensive blocks.
- Resolution: Replaced first-open-cell selection with a deterministic minimax strategy that evaluates all available moves and chooses the strongest outcome for the CPU.
- Rule constraint: Move choice remains deterministic via fixed position tie-break priority and still uses `canPlaceMove`/`placeMove` validation for legal placements.

#### BUG-001 CPU Move Requires User Interaction
- Reported: 2026-03-01
- Resolved: 2026-03-01
- Related stories: US-04, US-11, US-15
- Root cause: Gameplay UI accepted manual clicks during CPU turn and did not trigger CPU move logic when `currentPlayer` switched to `O`.
- Resolution: Added CPU-turn side effect to programmatically place a deterministic valid move and disabled board interaction when it is the CPU turn.
- Rule constraint: CPU move selection continues to use existing move validation rules (`canPlaceMove` and `placeMove`), so only valid moves are applied and no moves occur after game over.

## Phase 2

### Active

- None.

### Resolved

#### BUG-004 Multiplayer Shows Quit Alongside Resign
- Reported: 2026-03-16
- Resolved: 2026-03-16
- Related stories: US-13, US-35
- Root cause: The shared gameplay secondary control rendered `Quit` for active player sessions without excluding the multiplayer flow that already exposed `Resign`.
- Resolution: Updated gameplay controls so active multiplayer player sessions show only `Resign`, while the shared `Quit`/`Home` control remains unchanged for single-player and other non-active multiplayer states.
