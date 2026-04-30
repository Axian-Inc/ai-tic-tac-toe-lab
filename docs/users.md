# User Guide

## Open the App
The deployed application is available at:

http://ai-tic-tac-toe-lab-jhart-tic-tac-toe-590316689173.s3-website-us-west-2.amazonaws.com

If you are running the app locally, use the local URL printed by the development server.

## Player Name
Enter a name before starting a game.

Allowed names:

- 1 to 24 characters.
- Letters, numbers, underscores, and hyphens.
- No spaces or special characters outside `_` and `-`.

Examples that work: `Alex99`, `Alex_99`, `Alex-99`.

## Game Modes
### Player vs Player
Two local players share the same board and take turns on the same device.

### Player vs CPU
You play against the CPU. The app tells you whether you control `X` or `O`. The CPU makes a legal move immediately when it is the CPU's turn, including when the CPU starts first.

### Online Multiplayer
Online games use the backend server. The server validates turns, moves, wins, draws, resignations, and timeouts.

You can:

- Create a new online game.
- Join a waiting online game.
- Spectate a waiting or active online game.

Active online games can only be spectated. They cannot be joined as a player.

## Start a Local Game
1. Enter your name.
2. Choose `Player vs Player` or `Player vs CPU`.
3. Select `Start game`.

## Create an Online Game
1. Enter your name.
2. Choose `Online Multiplayer`.
3. Select `Create`.
4. Select `Create game`.
5. Share the displayed game id with another player.

The game waits until a second player joins.

## Join an Online Game
1. Enter your name.
2. Choose `Online Multiplayer`.
3. Select `Join`.
4. Select a waiting game from the in-progress list, or paste a game id.
5. Select `Join game`.

The in-progress list refreshes automatically and also has a manual `Refresh` button.

## Spectate an Online Game
1. Enter your name.
2. Choose `Online Multiplayer`.
3. Select `Spectate`.
4. Select a listed game, or paste a game id.
5. Select `Spectate game`.

Spectators can watch game updates but cannot place moves or resign.

## During a Game
The game screen shows:

- Game state.
- Mode.
- Current player.
- Controller.
- Winner.
- Move count.
- Move history.

For online games, it also shows:

- Game id.
- Connection status.
- Your role.
- Opponent information.

Playable cells are highlighted. Occupied, locked, or unavailable cells cannot be played.

## Results and Feedback
- Wins show result text and celebratory feedback.
- CPU losses show `You lose` and `Try again`.
- Draws are clearly labeled.
- Online resignations show the opponent as winner.
- Online timeouts can end a game as abandoned, with the timed-out player losing and the other player winning.

## Controls
### New game
Starts a fresh local game using the currently selected local mode.

### Mode
Switches local games between `Player vs Player` and `Player vs CPU`. Changing mode replaces the current local match with a fresh board.

### Rematch
After a finished CPU game, starts another CPU game.

### Create new online game
Starts a new online room using your current name.

### Resign
Available to online players during active games. Resigning ends the game and gives the win to the opponent.

### Quit game
Leaves the current game screen and returns to the landing page. In online games, this disconnects the current online session.

## Important Notes
- Local games are stored only in memory.
- Online games are stored by the backend and can be fetched again by game id.
- A browser refresh during an online spectator session can recover the game view.
- A browser refresh during an online player session may lose move authority because the player token is kept in memory only.
- If online multiplayer says it is not configured, the deployed or local app does not have the backend API URLs set. Local and CPU games can still be played.
