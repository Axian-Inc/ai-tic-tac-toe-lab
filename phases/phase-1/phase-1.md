# Tic Tac Toe Game
## Build the following:
- A local only Tic Tac Toe React app in TypeScript.
- Store game state/logic in a Game module that tracks:
    - Game state
    - Moves so far (order, placement)
    - Who’s turn is it?
    - Has anyone won?
    - Key behaviors (above) are covered in tests
- Landing Page
    - Greets user and allows the user to initiate a new game (e.g. “Play vs. CPU”)
- In Game 
    - Game states are reflected on a Game Detail page (e.g. who's turn it is, game over/winner)
    - A winning game (e.g. when completing a winning move) is celebrated with confetti and a "winning sound".
    - A losing game has a “losing sound”, and visual/written feedback to the user telling them to “try again”.
    - Making a move (placing a piece) produces a pleasant “thud” sound during game play.
    - Illegal moves cannot be made in the UI.
    - The UI provides visual feedback to the user on which moves are valid (e.g. on mouseover) and which are not.
    - A game can be quit
    - After a game against the CPU finishes a player has the option to Rematch
- There’s a deterministic CPU opponent (e.g. given the same board, will always make the same move).
- Project is well documented.
- IaC and means to deploy to Axian’s LnD AWS Account
- Exit Criteria
    - Game is deployed to Axian’s AWS LnD account.
    - There’s a Playwright script to play a full game including testing “winning” conditions.
    - Both the Playwright and the unit tests can be exercised from the command line (CI pipeline automate-able)
    - Project has a README.MD and is well documented.
    - You’ve gone through Codex CLI getting started docs.

## Screens
- phase-1-1.png
- phase-1-2.png

