# UI Test Cases

Last updated: 2026-04-07

## Purpose

This document defines manual UI test cases for the current Phase 3 Tic Tac Toe application so a UI automation engineer can later automate the flows. The cases are based on:

- `context/project-overview.md`
- `context/architecture.md`
- `context/user-stories.md`
- `context/testing-strategy.md`
- current UI behavior in `src/App.tsx`
- standard Tic Tac Toe rules: 3x3 board, alternating turns, 8 winning lines, no move allowed in an occupied cell, game ends on win or draw

## Scope

- Single-player UI
- Multiplayer modal flows
- Dedicated landing-page spectate flow
- Multiplayer gameplay UI
- Replay/catch-up UI
- Error handling visible in the UI
- Boundary conditions called out by the current implementation

## Out of Scope

- Browser audio quality validation beyond confirming no blocking UI regression
- Visual design pixel perfection
- Backend unit/API correctness outside what is surfaced in the UI
- Terminal-only code coverage generation
- GitHub Actions or pull-request pipeline behavior

## Test Environment Notes

- Single-player cases need only the frontend app.
- Multiplayer cases require frontend and backend running together. Current local command: `npm run dev:full`.
- Some multiplayer cases require 2 browser windows or 2 isolated browser sessions.
- Spectate cases require at least one active multiplayer game to exist before opening the spectator view.
- Some negative and boundary cases require seeded server state or network manipulation.
- Multiplayer game state is in process memory only. Restarting the backend clears waiting/active games and replay history.

## Suggested Automation Hooks

The current app exposes stable selectors for several key elements:

- `data-testid="landing-page"`
- `data-testid="gameplay-page"`
- `data-testid="game-status"`
- `data-testid="game-board"`
- `data-testid="board-cell-0"` through `data-testid="board-cell-8"`
- `data-testid="play-again-button"`

## Overall Preconditions

- Use a clean browser session unless the test explicitly requires an existing multiplayer session or replay state.
- Start from the landing page at `/` unless a test says otherwise.
- For multiplayer tests, run the frontend and backend together with `npm run dev:full`.
- Use separate browser windows or isolated browser contexts whenever a test requires a host, joiner, and spectator at the same time.
- For capacity, timeout, stale-data, and forced-error scenarios, use seeded backend state, test doubles, or network controls so the UI can be exercised deterministically.
- Remember that multiplayer state is stored only in process memory; restarting the backend clears waiting games, active games, and replay history.

## Test Cases

| Test ID | Test Name | IsAutomated | Step Number | Test Name | Type | Step | Expected Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UI-001 | Landing to Single-Player Start | Yes | 1 | Landing to Single-Player Start | Happy | Open the app at `/`. | Landing page is visible with title, intro text, `Play vs CPU`, `Multiplayer`, and `Spectate`. |
| UI-001 | Landing to Single-Player Start | Yes | 2 | Landing to Single-Player Start | Happy | Click `Play vs CPU`. | App navigates to gameplay and shows the gameplay page, status text, game board, and 9 board cells. |
| UI-001 | Landing to Single-Player Start | Yes | 3 | Landing to Single-Player Start | Happy | Observe the board before making any move. | Board renders as a 3x3 layout with exactly 9 cells, all empty, and status shows `Your turn (X)`. |
| UI-002 | Single-Player Move Validation and Quit | Yes | 1 | Single-Player Move Validation and Quit | Happy | Start a new single-player game. | Gameplay loads with an empty board and `Quit` visible for the in-progress game. |
| UI-002 | Single-Player Move Validation and Quit | Yes | 2 | Single-Player Move Validation and Quit | Happy | Click one empty cell. | The selected cell shows `X`, the CPU places one `O`, and turn feedback returns to the player unless the game is over. |
| UI-002 | Single-Player Move Validation and Quit | Yes | 3 | Single-Player Move Validation and Quit | Negative | Click the same occupied cell again. | The occupied cell does not change, no extra move is added, and the board state remains valid. |
| UI-002 | Single-Player Move Validation and Quit | Yes | 4 | Single-Player Move Validation and Quit | Negative | During CPU processing after a valid player move, attempt to click another empty cell quickly. | The player cannot place an extra `X`, and turn order remains valid. |
| UI-002 | Single-Player Move Validation and Quit | Yes | 5 | Single-Player Move Validation and Quit | Happy | Click `Quit`. | App returns to the landing page without a browser refresh. |
| UI-003 | Single-Player Draw, Replay, and Home | Yes | 1 | Single-Player Draw, Replay, and Home | Boundary | Start a fresh single-player game and play a full draw sequence that fills all 9 cells without a win. | Status shows `Game over: It's a draw.`, board interaction is blocked, and post-game controls are shown. |
| UI-003 | Single-Player Draw, Replay, and Home | Yes | 2 | Single-Player Draw, Replay, and Home | Negative | Attempt to click any board cell after the draw is reached. | No additional move is accepted and the board state does not change. |
| UI-003 | Single-Player Draw, Replay, and Home | Yes | 3 | Single-Player Draw, Replay, and Home | Happy | Click `Play Again`. | Board resets to 9 empty cells, game-over messaging clears, and X starts the fresh game. |
| UI-003 | Single-Player Draw, Replay, and Home | Yes | 4 | Single-Player Draw, Replay, and Home | Happy | Click `Home` after reaching a completed single-player game. | App returns to the landing page without a browser refresh. |
| UI-004 | Single-Player Win and Loss Outcomes | Yes | 1 | Single-Player Win and Loss Outcomes | Happy | Start a fresh single-player game with a known player-winning sequence available. | Game begins in a standard empty state with player X active. |
| UI-004 | Single-Player Win and Loss Outcomes | Yes | 2 | Single-Player Win and Loss Outcomes | Happy | Complete the winning sequence for X. | Status shows `Game over: You win!`, confetti appears, and `Play Again` is visible. |
| UI-004 | Single-Player Win and Loss Outcomes | Yes | 3 | Single-Player Win and Loss Outcomes | Negative | Attempt another move after the player win. | No additional move is accepted after the win. |
| UI-004 | Single-Player Win and Loss Outcomes | Yes | 4 | Single-Player Win and Loss Outcomes | Happy | Start a fresh single-player game with a known CPU-winning sequence available. | New game loads cleanly for a second outcome check. |
| UI-004 | Single-Player Win and Loss Outcomes | Yes | 5 | Single-Player Win and Loss Outcomes | Happy | Allow CPU to complete the winning line. | Status shows `Game over: CPU wins.`, `Try again.` is visible, and further moves are blocked. |
| UI-005 | Single-Player Winning-Line Coverage | Yes | 1 | Single-Player Winning-Line Coverage | Boundary | Prepare a controlled setup or repeated sessions for line validation. | Test harness or manual setup is ready to verify distinct winning lines. |
| UI-005 | Single-Player Winning-Line Coverage | Yes | 2 | Single-Player Winning-Line Coverage | Boundary | Validate row wins for `1-2-3`, `4-5-6`, and `7-8-9`. | Each completed row ends the game immediately, shows the correct winner, and blocks extra moves. |
| UI-005 | Single-Player Winning-Line Coverage | Yes | 3 | Single-Player Winning-Line Coverage | Boundary | Validate column wins for `1-4-7`, `2-5-8`, and `3-6-9`. | Each completed column ends the game immediately, shows the correct winner, and blocks extra moves. |
| UI-005 | Single-Player Winning-Line Coverage | Yes | 4 | Single-Player Winning-Line Coverage | Boundary | Validate diagonal wins for `1-5-9` and `3-5-7`. | Each completed diagonal ends the game immediately, shows the correct winner, and blocks extra moves. |
| UI-006 | Multiplayer Modal and Landing Spectate Entry Paths | Yes | 1 | Multiplayer Modal and Landing Spectate Entry Paths | Happy | Open the app on the landing page and click `Multiplayer`. | Modal opens above the landing page and shows `Your Name`, `Create`, `Join`, and `Spectate`. |
| UI-006 | Multiplayer Modal and Landing Spectate Entry Paths | Yes | 2 | Multiplayer Modal and Landing Spectate Entry Paths | Happy | Click the close button for the modal. | Modal closes and landing page remains visible. |
| UI-006 | Multiplayer Modal and Landing Spectate Entry Paths | Yes | 3 | Multiplayer Modal and Landing Spectate Entry Paths | Happy | Reopen the modal and click the backdrop outside the dialog. | Modal closes again without leaving the landing page. |
| UI-006 | Multiplayer Modal and Landing Spectate Entry Paths | Yes | 4 | Multiplayer Modal and Landing Spectate Entry Paths | Happy | Reopen the modal and press `Esc`. | Modal closes again without changing route or page state. |
| UI-006 | Multiplayer Modal and Landing Spectate Entry Paths | Yes | 5 | Multiplayer Modal and Landing Spectate Entry Paths | Happy | Click the landing-page `Spectate` button. | Modal opens directly in spectator discovery mode with active-game-only spectate content, `Refresh`, and no `Your Name` input shown. |
| UI-007 | Multiplayer Create Validation and Success | Yes | 1 | Multiplayer Create Validation and Success | Happy | Open the multiplayer modal on the `Create` tab. | Create form is visible and ready for validation. |
| UI-007 | Multiplayer Create Validation and Success | Yes | 2 | Multiplayer Create Validation and Success | Negative | Leave `Your Name` blank, enter a valid game name, and click `Create Game`. | Validation error states player name is required and no game is created. |
| UI-007 | Multiplayer Create Validation and Success | Yes | 3 | Multiplayer Create Validation and Success | Negative | Enter a valid player name, leave `Game Name` blank, and click `Create Game`. | Validation error states game name is required and no game is created. |
| UI-007 | Multiplayer Create Validation and Success | Yes | 4 | Multiplayer Create Validation and Success | Boundary | Enter leading and trailing spaces in both fields and submit with otherwise valid values. | Creation succeeds only if values are non-empty after trimming, and the created game uses the trimmed values. |
| UI-007 | Multiplayer Create Validation and Success | Yes | 5 | Multiplayer Create Validation and Success | Happy | Observe the host gameplay view after successful creation. | App shows multiplayer gameplay with match name, match ID, host label, waiting status, read-only board, and `Refresh Match`. |
| UI-008 | Multiplayer Create Field Boundaries | Yes | 1 | Multiplayer Create Field Boundaries | Boundary | Open the multiplayer modal on the `Create` tab. | Create inputs are available for boundary entry testing. |
| UI-008 | Multiplayer Create Field Boundaries | Yes | 2 | Multiplayer Create Field Boundaries | Boundary | Enter exactly 32 characters in `Your Name`, a valid game name, and submit. | Creation succeeds with the maximum valid player name length. |
| UI-008 | Multiplayer Create Field Boundaries | Yes | 3 | Multiplayer Create Field Boundaries | Negative | Attempt to enter more than 32 characters into `Your Name`. | UI prevents extra typing or otherwise blocks submission of an over-limit player name. |
| UI-008 | Multiplayer Create Field Boundaries | Yes | 4 | Multiplayer Create Field Boundaries | Boundary | Enter exactly 48 characters in `Game Name`, a valid player name, and submit. | Creation succeeds with the maximum valid game name length. |
| UI-008 | Multiplayer Create Field Boundaries | Yes | 5 | Multiplayer Create Field Boundaries | Negative | Attempt to enter more than 48 characters into `Game Name`. | UI prevents extra typing or otherwise blocks submission of an over-limit game name. |
| UI-009 | Multiplayer Discovery Empty, Refresh, and Listings | Yes | 1 | Multiplayer Discovery Empty, Refresh, and Listings | Happy | Open the modal, switch to `Join`, and use a backend with no waiting or active games. | Discovery shows an empty-state message telling the user no multiplayer games are available. |
| UI-009 | Multiplayer Discovery Empty, Refresh, and Listings | Yes | 2 | Multiplayer Discovery Empty, Refresh, and Listings | Happy | Click `Refresh` while still in the empty state. | Lists refresh without closing the modal or destabilizing the UI. |
| UI-009 | Multiplayer Discovery Empty, Refresh, and Listings | Yes | 3 | Multiplayer Discovery Empty, Refresh, and Listings | Happy | Seed at least one waiting game and one active game, then refresh discovery. | Waiting games list shows game name, game ID, host, status, `Join`, and `Spectate`; active games list shows active metadata and `Spectate`. |
| UI-010 | Multiplayer Join Success and Stale Join Failure | Yes | 1 | Multiplayer Join Success and Stale Join Failure | Happy | In Browser A, create a waiting game; in Browser B, open the `Join` tab. | The waiting game is visible to Browser B as joinable. |
| UI-010 | Multiplayer Join Success and Stale Join Failure | Yes | 2 | Multiplayer Join Success and Stale Join Failure | Happy | In Browser B, click `Join` for the waiting game. | Browser B enters gameplay as player O, the match becomes active, and the board is interactive only when it is O's turn. |
| UI-010 | Multiplayer Join Success and Stale Join Failure | Yes | 3 | Multiplayer Join Success and Stale Join Failure | Negative | In Browser C with stale discovery results, attempt to join the same game after Browser B already joined. | Join attempt fails gracefully with a visible error and Browser C does not enter an invalid gameplay state. |
| UI-011 | Dedicated Spectate Entry and Live Viewer | Yes | 1 | Dedicated Spectate Entry and Live Viewer | Happy | In Browser A and Browser B, create and join a multiplayer match so the game is active; in Browser C, stay on the landing page. | An active game exists and Browser C is ready to enter spectator discovery from the landing page. |
| UI-011 | Dedicated Spectate Entry and Live Viewer | Yes | 2 | Dedicated Spectate Entry and Live Viewer | Happy | In Browser C, click the landing-page `Spectate` button. | Spectate discovery opens directly, shows only active-game entries available to watch, and does not show waiting-game join controls or player-name entry. |
| UI-011 | Dedicated Spectate Entry and Live Viewer | Yes | 3 | Dedicated Spectate Entry and Live Viewer | Happy | Click `Spectate` for the active match. | Browser C enters gameplay as a spectator with a read-only board, spectator role text, live sync status, and `Refresh Match`. |
| UI-011 | Dedicated Spectate Entry and Live Viewer | Yes | 4 | Dedicated Spectate Entry and Live Viewer | Happy | In Browser A or Browser B, make a valid move while Browser C remains on the spectator gameplay page. | Browser C receives the updated board state and turn/status messaging in real time without needing a manual refresh. |
| UI-012 | Multiplayer Waiting Host Refresh to Active | Yes | 1 | Multiplayer Waiting Host Refresh to Active | Happy | Create a multiplayer game as the host and remain on the waiting gameplay view. | Status shows waiting for player O, help text instructs the host to share the match ID, and board is read-only. |
| UI-012 | Multiplayer Waiting Host Refresh to Active | Yes | 2 | Multiplayer Waiting Host Refresh to Active | Happy | Have another session join the game, then click `Refresh Match` in the host session. | Host view updates from waiting to active and shows correct host role, session state, and current turn messaging. |
| UI-013 | Multiplayer Turn Enforcement and Occupied Cell Blocking | No | 1 | Multiplayer Turn Enforcement and Occupied Cell Blocking | Happy | Open an active multiplayer game for a player whose turn it is. | Board is interactive for valid empty cells on the local player's turn. |
| UI-013 | Multiplayer Turn Enforcement and Occupied Cell Blocking | No | 2 | Multiplayer Turn Enforcement and Occupied Cell Blocking | Happy | Click one empty cell on the local player's turn. | Move is accepted, local mark appears, turn changes, and status updates correctly. |
| UI-013 | Multiplayer Turn Enforcement and Occupied Cell Blocking | No | 3 | Multiplayer Turn Enforcement and Occupied Cell Blocking | Negative | Try to click another empty cell immediately when it is now the opponent's turn. | Wrong-turn interaction is blocked and no additional move is submitted locally. |
| UI-013 | Multiplayer Turn Enforcement and Occupied Cell Blocking | No | 4 | Multiplayer Turn Enforcement and Occupied Cell Blocking | Negative | When the local player regains the turn, click an occupied cell. | Occupied cell remains unavailable and no move is accepted. |
| UI-014 | Multiplayer Sync and Refresh Fallback | No | 1 | Multiplayer Sync and Refresh Fallback | Happy | Open the same active game in player X, player O, and spectator sessions with backend available. | Live sync indicator loads and progresses toward a connected state. |
| UI-014 | Multiplayer Sync and Refresh Fallback | No | 2 | Multiplayer Sync and Refresh Fallback | Happy | Make a valid move in one player session. | Opponent and spectator both see the updated board state and turn status through live sync or refresh fallback. |
| UI-014 | Multiplayer Sync and Refresh Fallback | No | 3 | Multiplayer Sync and Refresh Fallback | Negative | Interrupt websocket connectivity while HTTP remains reachable. | UI shows unavailable or reconnecting sync state while keeping the gameplay page stable. |
| UI-014 | Multiplayer Sync and Refresh Fallback | No | 4 | Multiplayer Sync and Refresh Fallback | Happy | Click `Refresh Match` after live sync is unavailable. | Latest authoritative match state reloads successfully without leaving gameplay. |
| UI-015 | Multiplayer Role-Based Controls and Resignation | No | 1 | Multiplayer Role-Based Controls and Resignation | Happy | In an active multiplayer player session, observe gameplay controls. | `Resign` and `Check Timeout` are visible and shared `Quit` is not shown. |
| UI-015 | Multiplayer Role-Based Controls and Resignation | No | 2 | Multiplayer Role-Based Controls and Resignation | Negative | Click `Resign` and cancel the browser confirmation. | Match remains active and no resignation occurs. |
| UI-015 | Multiplayer Role-Based Controls and Resignation | No | 3 | Multiplayer Role-Based Controls and Resignation | Happy | Click `Resign` again and confirm. | Match ends immediately, status reflects resignation, and no further moves are allowed. |
| UI-015 | Multiplayer Role-Based Controls and Resignation | No | 4 | Multiplayer Role-Based Controls and Resignation | Happy | Observe controls in a spectator session, a waiting-host session, and a completed-game session. | Spectator shows `Home` without `Resign` or `Check Timeout`; waiting host shows `Quit`; completed game shows `Home` with move input blocked. |
| UI-016 | Multiplayer Replay and Read-Only Live Return | No | 1 | Multiplayer Replay and Read-Only Live Return | Happy | Open a multiplayer game that has at least one recorded move in its history. | Replay card is visible with `Start`, `Back`, `Next`, and `Return to Live`. |
| UI-016 | Multiplayer Replay and Read-Only Live Return | No | 2 | Multiplayer Replay and Read-Only Live Return | Happy | Click `Start`, then `Next`, then `Back`. | Board and replay status update to the selected historical frame. |
| UI-016 | Multiplayer Replay and Read-Only Live Return | No | 3 | Multiplayer Replay and Read-Only Live Return | Negative | While replay mode is active, try to click board cells or use resignation or timeout actions. | Live mutation actions are blocked while replay is active. |
| UI-016 | Multiplayer Replay and Read-Only Live Return | No | 4 | Multiplayer Replay and Read-Only Live Return | Happy | Click `Return to Live`. | Authoritative live board state is restored and normal live session controls return. |
| UI-017 | Multiplayer Refresh Recovery by Session Type | No | 1 | Multiplayer Refresh Recovery by Session Type | Happy | Refresh the browser page while in an active multiplayer player session. | Session reloads into the correct game and player role using URL or history recovery. |
| UI-017 | Multiplayer Refresh Recovery by Session Type | No | 2 | Multiplayer Refresh Recovery by Session Type | Happy | Refresh the browser page while in a spectator session. | Spectator remains in the same game and the board reloads as read-only. |
| UI-018 | Multiplayer Abandonment Messaging and Resolution | No | 1 | Multiplayer Abandonment Messaging and Resolution | Happy | Open an active game where the local player is currently awaited. | UI shows that the local player's timeout window is counting down. |
| UI-018 | Multiplayer Abandonment Messaging and Resolution | No | 2 | Multiplayer Abandonment Messaging and Resolution | Happy | Open an active game where the opponent is awaited, then view the same game as a spectator. | Player session explains opponent timeout behavior and spectator session shows which player is awaited with remaining time. |
| UI-018 | Multiplayer Abandonment Messaging and Resolution | No | 3 | Multiplayer Abandonment Messaging and Resolution | Negative | Click `Check Timeout` before the 3-minute abandonment deadline expires. | UI shows an error that abandonment cannot yet be resolved and the match remains active. |
| UI-018 | Multiplayer Abandonment Messaging and Resolution | No | 4 | Multiplayer Abandonment Messaging and Resolution | Boundary | After the awaited player has exceeded the 3-minute deadline, click `Check Timeout`. | Match transitions to over, status reflects abandonment outcome, and no more moves are accepted. |
| UI-019 | Multiplayer Create Capacity and API Error Handling | Yes | 1 | Multiplayer Create Capacity and API Error Handling | Boundary | Seed the backend with 25 waiting or active games and open the create flow. | Create form is available but system is already at documented capacity. |
| UI-019 | Multiplayer Create Capacity and API Error Handling | Yes | 2 | Multiplayer Create Capacity and API Error Handling | Boundary | Attempt to create one more multiplayer game. | UI shows a visible capacity error and no game is opened. |
| UI-019 | Multiplayer Create Capacity and API Error Handling | Yes | 3 | Multiplayer Create Capacity and API Error Handling | Negative | Force the create endpoint to fail and submit a valid create request. | Visible create error is shown and the modal remains usable. |
| UI-020 | Multiplayer Discovery and Gameplay Refresh API Errors | Yes | 1 | Multiplayer Discovery and Gameplay Refresh API Errors | Negative | Force the discovery endpoint to fail, then open the `Join` tab or the landing-page `Spectate` flow and click `Refresh`. | Visible discovery error is shown and the modal remains open and stable. |
| UI-020 | Multiplayer Discovery and Gameplay Refresh API Errors | Yes | 2 | Multiplayer Discovery and Gameplay Refresh API Errors | Negative | Open multiplayer gameplay and force the match detail refresh endpoint to fail. | Current gameplay UI remains rendered and stable before refresh is attempted. |
| UI-020 | Multiplayer Discovery and Gameplay Refresh API Errors | Yes | 3 | Multiplayer Discovery and Gameplay Refresh API Errors | Negative | Click `Refresh Match` while the detail endpoint is failing. | Visible gameplay refresh error is shown and the page does not crash. |

## Additional Coverage Notes

- For automation, parameterize Tic Tac Toe board positions rather than hard-coding one board path for all rule validations.
- Use separate browser contexts for multiplayer player-vs-player and spectator scenarios.
- For capacity, abandonment, and forced network-error cases, a seeded backend or test doubles will make automation significantly more reliable than purely manual timing.
