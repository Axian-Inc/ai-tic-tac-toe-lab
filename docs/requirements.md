# Tic-Tac-Toe Game Rules Requirements

## Scope

This document defines the game rules and player-flow requirements for a front-end tic-tac-toe application implemented in React with TypeScript.

The application must support both of the following modes in the current phase:

* player vs player
* player vs CPU

The rules must remain neutral enough that the same core move-validation engine can support future online multiplayer.

This document covers game behavior, mode behavior, and terminal-state messaging. It does not define persistence, networking, or back-end APIs.

## Domain Model

### Board

* The board is a 3x3 grid.
* The board contains exactly 9 addressable cells.
* Each cell has one of the following values:

  * `null`
  * `"X"`
  * `"O"`

### Marks

* The game supports exactly two legal marks:

  * `"X"`
  * `"O"`

### Game Modes

The system must support the following game mode values:

* `"player-vs-player"`
* `"player-vs-cpu"`

### Controller Types

Each mark must be controlled by exactly one controller type:

* `"human"`
* `"cpu"`

In player-vs-player mode:

* both `"X"` and `"O"` are controlled by humans

In player-vs-cpu mode:

* exactly one mark is controlled by a human
* exactly one mark is controlled by the CPU

### Game State Terminology

The game must use the following game state values:

* `"initializing"`
* `"active"`
* `"won"`
* `"draw"`
* `"abandoned"`

### Move Record

A move record must contain at least:

* `moveNumber`
* `playerMark`
* `cellIndex`

Optional metadata such as timestamp or actor type may be added later, but is not required in this phase.

## Functional Requirements

### FR-001: Board Structure

The system must represent the tic-tac-toe board as exactly 9 cells arranged in 3 rows and 3 columns.

### FR-002: Allowed Marks

The system must support exactly two legal marks: `"X"` and `"O"`.

### FR-003: Supported Modes

The system must allow the user to select one of the following modes:

* `"player-vs-player"`
* `"player-vs-cpu"`

### FR-004: New Game Initialization

When a new game begins, the system must:

* create an empty board
* clear winner data
* clear draw data
* clear abandoned-game data
* initialize an empty move history
* initialize the selected game mode
* randomly select the starting player from `"X"` or `"O"`
* assign mark controllers for the selected mode
* set the game state to `"active"` after initialization is complete

### FR-005: Randomized Starting Player

The system must select the starting player using true randomness at the beginning of each new game.

The selected starting player must be one of:

* `"X"`
* `"O"`

The implementation must not:

* hardcode the starting player
* use a deterministic alternating pattern

### FR-006: CPU-Mode Controller Assignment

When a new player-vs-cpu game begins, the system must randomly assign which mark is controlled by the human and which mark is controlled by the CPU.

The implementation must ensure:

* exactly one human-controlled mark exists
* exactly one CPU-controlled mark exists
* either mark may be assigned to either controller

### FR-007: Turn Management

The system must allow exactly one move per turn.

After each valid move, the system must:

* evaluate for win
* evaluate for draw
* if the game remains playable, switch the current turn to the other mark

### FR-008: Valid Move Rules

A move is valid only when all of the following are true:

* the game state is `"active"`
* the target cell is empty
* the acting player matches the current turn
* the acting player is controlled by the actor attempting the move

### FR-009: Invalid Move Rejection

The system must reject a move when any of the following are true:

* the game state is not `"active"`
* the target cell is already occupied
* the acting player does not match the current turn
* the target cell index is outside the valid board range

Rejected moves must not mutate:

* board state
* move history
* current turn
* winner
* game state

### FR-010: Win Conditions

The system must declare a winner when one player occupies all 3 cells in any one winning line.

Winning lines are:

* 3 horizontal rows
* 3 vertical columns
* 2 diagonals

### FR-011: Winner Resolution

When a valid move creates a winning line, the system must:

* set the winner to the acting player's mark
* set the game state to `"won"`
* stop accepting further moves

### FR-012: Draw Conditions

The system must declare a draw when:

* all 9 cells are occupied
* no winning line exists for either player

### FR-013: Draw Resolution

When a valid move causes a draw, the system must:

* set winner to `null`
* set the game state to `"draw"`
* stop accepting further moves

### FR-014: Move History Tracking

The system must track move history only for the current in-memory game lifecycle.

For each valid move, the system must append one move record to move history.

### FR-015: Move History Lifetime

The system must discard move history when a game is no longer active for continued play.

At minimum, move history must be discarded when:

* a completed game is replaced by a new game
* an active game is explicitly abandoned by the user
* the game mode is changed and a new game replaces the current game
* the current game session is explicitly reset

The system must not carry move history from one game into another game.

### FR-016: Abandoned Game State

The system must support an `"abandoned"` game state for cases where an in-progress game is intentionally terminated by an explicit user abandon or exit action before reaching `"won"` or `"draw"`.

When a game is abandoned, the system must:

* set the game state to `"abandoned"`
* stop accepting further moves for that game instance
* ensure abandoned-game data does not affect the next new game

The system must not automatically mark a game as `"abandoned"` unless the user explicitly triggers the abandon or exit action.

### FR-017: Post-Game Move Locking

The system must reject all move attempts when the game state is:

* `"won"`
* `"draw"`
* `"abandoned"`

### FR-018: CPU Response Timing

In player-vs-cpu mode, when a human completes a valid move and the game remains `"active"`, the CPU must make its legal move immediately.

The implementation must ensure:

* the CPU acts only during CPU-controlled turns
* the CPU does not act after a human winning move
* the CPU does not act after a human drawing move
* exactly one CPU move is performed per CPU turn
* given the same board state and current CPU turn, the CPU chooses the same move every time

### FR-019: CPU Opening Move

In player-vs-cpu mode, if the randomized starting player is controlled by the CPU, the CPU must make the opening move immediately after the new game becomes playable.

The CPU's opening move must follow the deterministic CPU move policy defined for the application.

### FR-020: Human Input Locking During CPU Turns

In player-vs-cpu mode, the user interface must not allow the human to place marks while the current turn belongs to the CPU.

### FR-021: Mode Switching Behavior

When the user changes the selected game mode, the system must immediately replace the current match with a new game in the selected mode.

The new game must:

* start with an empty board
* clear move history
* clear winner data
* clear draw data
* clear abandoned data
* re-randomize starting player
* assign controllers for the new mode

### FR-022: Terminal Result Banner

When the game enters a terminal result state of `"won"` or `"draw"`, the system must display a large text banner that communicates the result.

In player-vs-cpu mode:

* display `"You win"` when the human-controlled mark wins
* display `"You lose"` when the CPU-controlled mark wins
* display `"Draw"` when the game ends in a draw

In player-vs-player mode:

* display `"X wins"` when `"X"` wins
* display `"O wins"` when `"O"` wins
* display `"Draw"` when the game ends in a draw

The terminal-result banner must not be shown for the `"abandoned"` state.

### FR-023: Mark Contrast

The `"X"` and `"O"` symbols must use distinct high-contrast colors.

The implementation must ensure:

* `"X"` and `"O"` are not rendered with the same color
* both marks remain highly legible against the dark board theme

## User Stories

### US-001: Start a Game

As a player, I want a new game to begin with an empty board and a randomized starting mark so that gameplay begins in a valid and unbiased state.

### US-002: Choose a Mode

As a player, I want to choose whether I am playing against another person or against the CPU so that I can select the match style I want.

### US-003: Take a Turn

As a player, I want to place my mark only when it is my turn so that the game remains valid.

### US-004: Receive an Immediate CPU Reply

As a player in CPU mode, I want the CPU to act immediately after my turn so that the game flow feels continuous.

### US-005: Detect a Winner

As a player, I want the game to detect a completed winning line immediately after a valid move so that the winner is determined correctly.

### US-006: Detect a Draw

As a player, I want the game to detect a draw when the board is full without a winner so that the game ends correctly.

### US-007: Understand the Match Result

As a player, I want a prominent terminal-state banner that tells me whether I won, lost, or drew so that the result is immediately clear.

### US-008: Reset Cleanly

As a player, I want a new game or mode change to discard the previous game's board state and move history so that each game starts cleanly.

### US-009: Abandon a Game Explicitly

As a player, I want an explicit abandon action to end the current game without recording it as a win or draw.

## Acceptance Criteria

### AC-001: New player-vs-player game initializes correctly

**Given**

* no active game exists

**When**

* a new player-vs-player game is created

**Then**

* the board should contain exactly 9 cells
* each board cell should equal `null`
* the move history should equal `[]`
* the winner should equal `null`
* the game state should equal `"active"`
* the current player should be either `"X"` or `"O"`
* both marks should be human-controlled

### AC-002: CPU mode initializes with exactly one human and one CPU controller

**Given**

* no active game exists

**When**

* a new player-vs-cpu game is created

**Then**

* the game mode should equal `"player-vs-cpu"`
* exactly one mark should be controlled by a human
* exactly one mark should be controlled by the CPU
* the current player should still be either `"X"` or `"O"`

### AC-003: Valid move updates board and history

**Given**

* the game state is `"active"`
* the current player is `"X"`
* cell index `0` is empty

**When**

* player `"X"` plays cell index `0`

**Then**

* board cell `0` should equal `"X"`
* move history length should increase by 1
* the latest move record should contain the acting mark and target cell
* the current player should switch to `"O"` if no win or draw occurred

### AC-004: Occupied cell move is rejected

**Given**

* the game state is `"active"`
* board cell `0` equals `"X"`
* the current player is `"O"`

**When**

* player `"O"` attempts to play cell index `0`

**Then**

* the move should be rejected
* board cell `0` should remain `"X"`
* move history length should not change
* the current player should remain `"O"`
* the game state should remain `"active"`

### AC-005: Out-of-turn move is rejected

**Given**

* the game state is `"active"`
* the current player is `"X"`

**When**

* player `"O"` attempts to play any empty valid cell

**Then**

* the move should be rejected
* the board should not change
* move history should not change
* the current player should remain `"X"`

### AC-006: Out-of-range cell index is rejected

**Given**

* the game state is `"active"`

**When**

* a player attempts to play cell index `-1` or `9`

**Then**

* the move should be rejected
* the board should not change
* move history should not change

### AC-007: Row win is detected

**Given**

* the board equals `["X", "X", null, "O", "O", null, null, null, null]`
* the current player is `"X"`
* the game state is `"active"`

**When**

* player `"X"` plays cell index `2`

**Then**

* the winner should equal `"X"`
* the game state should equal `"won"`
* the board at index `2` should equal `"X"`
* no further moves should be accepted

### AC-008: Column win is detected

**Given**

* the board equals `["X", "O", null, "X", "O", null, null, null, null]`
* the current player is `"O"`
* the game state is `"active"`

**When**

* player `"O"` plays cell index `7`

**Then**

* the winner should equal `"O"`
* the game state should equal `"won"`

### AC-009: Diagonal win is detected

**Given**

* the board equals `["X", "O", null, "O", "X", null, null, null, null]`
* the current player is `"X"`
* the game state is `"active"`

**When**

* player `"X"` plays cell index `8`

**Then**

* the winner should equal `"X"`
* the game state should equal `"won"`

### AC-010: Draw is detected correctly

**Given**

* the board equals `["X", "O", "X", "X", "O", "O", "O", "X", null]`
* the current player is `"X"`
* the game state is `"active"`

**When**

* player `"X"` plays cell index `8`

**Then**

* the winner should equal `null`
* the game state should equal `"draw"`
* the board should contain no `null` values
* no further moves should be accepted

### AC-011: Moves are rejected after a win

**Given**

* the game state is `"won"`
* the winner equals `"X"`

**When**

* any player attempts to play an empty cell

**Then**

* the move should be rejected
* the board should not change
* move history should not change

### AC-012: Moves are rejected after a draw

**Given**

* the game state is `"draw"`

**When**

* any player attempts to play any cell

**Then**

* the move should be rejected
* the board should not change
* move history should not change

### AC-013: Explicit abandon action transitions game to abandoned

**Given**

* the game state is `"active"`
* the game contains one or more moves

**When**

* the user explicitly triggers the abandon action

**Then**

* the game state should equal `"abandoned"`
* subsequent moves should be rejected
* the abandoned game must not be treated as `"won"`
* the abandoned game must not be treated as `"draw"`

### AC-014: Human move in CPU mode is followed by one immediate CPU move

**Given**

* the game mode is `"player-vs-cpu"`
* the current turn belongs to the human
* the game state is `"active"`

**When**

* the human places a valid mark that does not end the game

**Then**

* the human move should be recorded
* the CPU should immediately place one valid mark
* move history should contain both moves
* control should return to the human if the game remains `"active"`
* repeated executions from the same board state should yield the same CPU move

### AC-015: CPU does not move after a human terminal move

**Given**

* the game mode is `"player-vs-cpu"`
* the current turn belongs to the human
* the human can win or draw with the next move

**When**

* the human makes that terminal move

**Then**

* the game should enter `"won"` or `"draw"`
* the CPU should not place any follow-up move

### AC-016: CPU makes an opening move when it starts

**Given**

* the game mode is `"player-vs-cpu"`
* the randomized starting mark is controlled by the CPU

**When**

* the new game becomes playable

**Then**

* the CPU should immediately place one valid opening move
* move history should contain exactly 1 record
* the next turn should belong to the human if the game remains `"active"`
* the opening move should be the highest-priority available cell from the deterministic CPU order

### AC-021: CPU move selection is deterministic

**Given**

* the game mode is `"player-vs-cpu"`
* the current turn belongs to the CPU
* the board contains one or more legal moves

**When**

* the CPU selects a move from the same board state multiple times

**Then**

* the same cell index should be selected every time
* the chosen move should be the first legal cell in this fixed priority order:
  * `4`
  * `0`
  * `2`
  * `6`
  * `8`
  * `1`
  * `3`
  * `5`
  * `7`

### AC-017: Changing modes resets the current match

**Given**

* a game is in progress

**When**

* the user changes the selected mode

**Then**

* the current game should be replaced immediately
* the new board should contain only `null` values unless the CPU is required to open
* the new game should use the newly selected mode
* prior move history should not be retained

### AC-018: CPU-mode terminal banner shows player-facing result

**Given**

* the game mode is `"player-vs-cpu"`

**When**

* the game ends in a win for the human, a win for the CPU, or a draw

**Then**

* the terminal banner should show `"You win"`, `"You lose"`, or `"Draw"` respectively

### AC-019: Player-vs-player terminal banner shows mark-based result

**Given**

* the game mode is `"player-vs-player"`

**When**

* the game ends in a win for `"X"`, a win for `"O"`, or a draw

**Then**

* the terminal banner should show `"X wins"`, `"O wins"`, or `"Draw"` respectively

### AC-020: X and O use different high-contrast colors

**Given**

* the board displays at least one `"X"` and one `"O"`

**When**

* the marks are rendered

**Then**

* the `"X"` and `"O"` should not use the same color
* both marks should remain highly legible against the dark board background

## Notes for Implementation

### Recommended Types

```ts
type PlayerMark = "X" | "O";
type CellValue = PlayerMark | null;
type GameMode = "player-vs-player" | "player-vs-cpu";
type ActorType = "human" | "cpu";
type GameState = "initializing" | "active" | "won" | "draw" | "abandoned";

type MoveRecord = {
  moveNumber: number;
  playerMark: PlayerMark;
  cellIndex: number;
};
```

### Recommended Rule Boundary

Keep single-move validation and mutation inside the core game engine:

```ts
playMove(game, actingPlayerMark, cellIndex)
```

Keep CPU orchestration outside that boundary:

* determine whether the current controller is CPU
* choose a legal move
* apply exactly one legal CPU move through the same `playMove` function

### CPU Behavior Note

For this phase, the CPU must use a deterministic legal-move policy rather than randomness.

The CPU must select the first legal cell in this fixed priority order:

* `4`
* `0`
* `2`
* `6`
* `8`
* `1`
* `3`
* `5`
* `7`

The requirements do not mandate heuristic or perfect play.
