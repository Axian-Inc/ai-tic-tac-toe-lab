# Project Overview

Last updated: 2026-03-09

## Phase 1

### Purpose
Build a local-only Tic-Tac-Toe web app using React and TypeScript. The game runs entirely in the browser with no backend, no multiplayer networking, and no cloud persistence.

### Goals
- Provide a clean, responsive single-player Tic-Tac-Toe experience.
- Match the intended visual direction shown in `context/example-images/`.
- Keep game rules and state management centralized in a dedicated Game module.

### Scope

#### In Scope
- React + TypeScript frontend application.
- Landing page with:
- User greeting and game introduction.
- A clear action to start a new game.
- Gameplay page with:
- A 3x3 board and current game progression.
- Current player turn while the game is active.
- Game-over state and winner/draw outcome.
- Local game state management in a `Game` module tracking:
- Full game state.
- Moves so far (order and placement).
- Current player turn.
- Win status (winner or no winner/draw/in progress as applicable).

#### Out of Scope
- Online multiplayer.
- Backend services or databases.
- User accounts/authentication.
- Remote analytics or telemetry.

### Core Functional Requirements
- A new game can be initiated from the landing page.
- Gameplay transitions from landing to active board state.
- Players place marks on valid empty cells only.
- Turn order alternates correctly.
- Win and draw conditions are evaluated after each move.
- Once game over is reached, the UI clearly communicates result state.

### Primary Screens
- Landing page: introductory screen with title/greeting and start-new-game call to action, following the style and structure from `context/example-images/landing_page_exmaple.png`.
- Gameplay page: board-centric screen showing player indicators, active turn/game-over feedback, and controls for replay/navigation, following `context/example-images/gameplay_page_example.png`.

### Stakeholders
- End user: person playing a local Tic-Tac-Toe game in browser.
- Development team: contributors implementing and maintaining the app.

## Phase 2

### Purpose
Extend the app from local-only play into a low-cost deployed multiplayer experience with server-brokered games, live updates, and spectator support.

### Goals
- Support both single-player and multiplayer play modes in the same product.
- Add a lightweight server API that validates moves, manages multiplayer sessions, and broadcasts updates.
- Preserve low-cost AWS deployment patterns while introducing the minimum backend infrastructure needed for Phase 2.
- Keep increments deployable so the app can ship safely after each completed story.

### Scope

#### In Scope
- Multiplayer game creation and joining.
- Server-side game ownership of authoritative multiplayer state.
- HTTP APIs for game lifecycle actions and websocket delivery for live updates.
- Spectator support for live games and replay/catch-up from persisted move history.
- Multiplayer end conditions including normal wins, draw, resignation, and abandonment timeout.
- Capacity guardrail of 25 concurrent multiplayer games with HTTP 429 when full.
- S3 client updates to create and join multiplayer games.
- AWS infrastructure updates required for low-cost deployment of the multiplayer system.

#### Out of Scope
- User accounts, authentication, or player identity beyond per-session participation.
- Matchmaking, chat, rankings, or social features.
- More than 25 concurrent multiplayer games in Phase 2.

### Core Functional Requirements
- Players can choose single-player or multiplayer from the client.
- One player can create a multiplayer game and another can join it.
- The server validates multiplayer moves and rejects invalid commands.
- Connected players and spectators receive live game updates.
- Abandoned games are ended by server decision after 3 minutes without a required move.
- Completed and in-progress games retain enough event history for catch-up and replay.

### Primary Screens
- Landing page adds clear multiplayer entry points for creating and joining a game.
- Gameplay page supports local single-player and server-backed multiplayer states.
- Multiplayer join/waiting states are surfaced in the client without breaking existing single-player flows.
