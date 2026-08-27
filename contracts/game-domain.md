# Game Domain Contract

Status: accepted for Phase 1

This contract defines the vocabulary shared by the TypeScript client, future
C# server, documentation, and acceptance tests.

## Board and players

- The board contains nine cells numbered `0` through `8` in row-major order:

  ```text
  0 | 1 | 2
  --+---+--
  3 | 4 | 5
  --+---+--
  6 | 7 | 8
  ```

- `X` is the local human player and `O` is the CPU.
- `X` always moves first, including after a rematch.
- A cell contains `X`, `O`, or `null`.
- Move `ply` values start at `1` and increase by one for every accepted move.

## State vocabulary

The canonical game statuses are:

- `playing`: moves may still be accepted;
- `won`: `winner` is `X` or `O` and no further move is legal;
- `draw`: all cells are occupied without a winner;
- `quit`: the player ended the game before another terminal result.

`currentTurn` is `X` or `O` only while the status is `playing`; it is `null`
for every terminal status. `winner` is non-null only for `won`.

The ordered move history contains `{ ply, player, cell }`. The board must be
derivable from this history, and implementations must preserve both.

## Move behavior

An accepted move:

1. places the current player's mark in an empty cell;
2. appends exactly one ordered history entry;
3. evaluates all winning lines;
4. transitions to `won` or `draw`, or changes `currentTurn`.

Rejected moves do not change state. Canonical rejection reasons are:

- `out_of_range`: the cell is not an integer from `0` through `8`;
- `occupied`: the selected cell already contains a mark;
- `wrong_turn`: the supplied player is not `currentTurn`;
- `game_over`: the status is not `playing`.

Winning lines are `[0,1,2]`, `[3,4,5]`, `[6,7,8]`, `[0,3,6]`, `[1,4,7]`,
`[2,5,8]`, `[0,4,8]`, and `[2,4,6]`.

## CPU policy

The CPU receives a valid `playing` position whose current turn is `O`:

1. If one or more legal moves immediately win for `O`, choose the lowest cell
   number among those moves.
2. Otherwise choose the lowest-numbered legal cell.

The CPU does not block a human threat. This intentional limitation makes it
beatable while remaining completely deterministic.

Canonical human-win sequence with automatic CPU responses:

```text
X:0, O:1, X:3, O:2, X:6
```

Canonical CPU-win sequence:

```text
X:4, O:0, X:8, O:1, X:6, O:2
```

The pure game module must keep CPU selection separate from applying a move so
both behaviors can be tested independently.

## Quit, rematch, and feedback

- Quitting transitions a `playing` game to `quit`, preserves its moves, clears
  `currentTurn`, and returns the UI to the landing experience.
- Quitting an already terminal game is a `game_over` rejection.
- Rematch creates a new game with an empty board/history, `playing` status, and
  `X` to move. It does not mutate the completed game.
- Every accepted human or CPU placement requests the move/thud cue.
- A human (`X`) win requests confetti and the winning cue.
- A CPU (`O`) win requests the losing cue and visible text containing
  `Try again`.
- A draw uses visible draw feedback and no win/loss cue.
- Audio failure or mute must not change state or block play. Reduced-motion
  preference suppresses confetti motion while preserving written feedback.

Tests should assert observable state and written feedback rather than attempt
to prove that a physical speaker produced sound.

