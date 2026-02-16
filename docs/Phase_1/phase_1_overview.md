Phase 1 - Single-Player Tic-Tac-Toe Game
Primary Goal
Practicing thoughtful repeatable use of Generative AI throughout the full development lifecycle, not just code generation.

Use AI to generate/enrich stories from coarse requirements.

Use AI to accelerate/enable testing.

Use AI for Code Gen.

Use AI for project documentation (updating context).

Tic Tac Toe Game
Build the following:

A local only Tic Tac Toe React app in TypeScript.

Store game state/logic in a Game module that tracks:

Game state

Moves so far (order, placement)

Who’s turn is it?

Has anyone won?

Key behaviors (above) are covered in tests

Landing Page

Greets user and allows the user to initiate a new game (e.g. “Play vs. CPU”)

In Game 

Game states are reflected on a Game Detail page (e.g. who's turn it is, game over/winner)

A winning game (e.g. when completing a winning move) is celebrated with confetti and a "winning sound".

A losing game has a “losing sound”, and visual/written feedback to the user telling them to “try again”.

Making a move (placing a piece) produces a pleasant “thud” sound during game play.

Illegal moves cannot be made in the UI.

The UI provides visual feedback to the user on which moves are valid (e.g. on mouseover) and which are not.

A game can be quit

After a game against the CPU finishes a player has the option to Rematch

There’s a deterministic CPU opponent (e.g. given the same board, will always make the same move).

Project is well documented.

IaC and means to deploy to Axian’s LnD AWS Account

Exit Criteria
Game is deployed to Axian’s AWS LnD account.

There’s a Playwright script to play a full game including testing “winning” conditions.

Both the Playwright and the unit tests can be exercised from the command line (CI pipeline automate-able)

Project has a README.MD and is well documented.

You’ve gone through Codex CLI getting started docs.

Do Focus On

A high quality dev environment with strong AI support

A configured Codex (logged into Axian’s Open AI instance) and AWS CLI (logged into Axian’s L&D account)

A high quality Read Me/Getting Started for humans

Managing project context in a intentional way, like this example memory bank technique.

Turning requirements into actionable stories.

Test setups (unit and playwright).

Work patterns (what am I spending my time on?).

Learning Codex

Get to know Codex as a tool/CLI

Watch a Codex Getting Started

…and have a look at some example custom prompts that your peers have created for your use.