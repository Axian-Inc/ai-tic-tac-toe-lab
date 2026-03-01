# Bugs

Last updated: 2026-03-01

This file tracks active and resolved product defects discovered during development and testing.

## Active

- None.

## Resolved

### BUG-001 CPU Move Requires User Interaction
- Reported: 2026-03-01
- Resolved: 2026-03-01
- Related stories: US-04, US-11, US-15
- Root cause: Gameplay UI accepted manual clicks during CPU turn and did not trigger CPU move logic when `currentPlayer` switched to `O`.
- Resolution: Added CPU-turn side effect to programmatically place a deterministic valid move and disabled board interaction when it is the CPU turn.
- Rule constraint: CPU move selection continues to use existing move validation rules (`canPlaceMove` and `placeMove`), so only valid moves are applied and no moves occur after game over.
