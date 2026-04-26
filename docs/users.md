# User Guide

## Start a Game
1. Open the app: http://ai-tic-tac-toe-lab-jhart-tic-tac-toe-590316689173.s3-website-us-west-2.amazonaws.com
2. Enter your name.
3. Choose `Player vs Player` or `Player vs CPU`.
4. Select `Start game`.

Your name can use letters and numbers only, with a maximum of 24 characters.

## Game Modes
### Player vs Player
- Two local players share the same board.
- The matchup label shows `<your name> vs <your name>`.

### Player vs CPU
- You play against the CPU.
- The matchup label shows `<your name> vs CPU`.
- The game tells you which mark you control.

## During the Game
- The Game Detail area shows the current state, mode, current player, controller, winner, and move count.
- The board highlights which cells are currently playable.
- Occupied or unavailable cells cannot be played.
- A move sound plays when a piece is placed.

## Results and Feedback
- Winning games show celebratory feedback.
- Losing to the CPU shows a losing message and tells you to try again.
- Draws are clearly labeled.
- Move history is shown for the current game only.

## Controls
### New game
Starts a fresh game using the currently selected mode.

### Mode
Switches between `Player vs Player` and `Player vs CPU`. Changing mode replaces the current match with a new one.

### Quit game
Leaves the current game screen and returns you to the landing page.

### Rematch
After a finished CPU game, you can start another CPU game by selecting `Rematch`.

## Important Notes
- The starting player is chosen randomly.
- In CPU mode, the CPU may start first.
- The CPU always makes a legal move immediately when it is the CPU's turn.
- The app does not save games between sessions.
