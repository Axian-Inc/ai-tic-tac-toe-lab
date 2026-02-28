# Project Overview

Last updated: 2026-02-28

## Purpose
Build a local-only Tic-Tac-Toe web app using React and TypeScript. The game runs entirely in the browser with no backend, no multiplayer networking, and no cloud persistence.

## Goals
- Provide a clean, responsive single-player Tic-Tac-Toe experience.
- Match the intended visual direction shown in `context/example-images/`.
- Keep game rules and state management centralized in a dedicated Game module.

## Scope

### In Scope
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

### Out of Scope
- Online multiplayer.
- Backend services or databases.
- User accounts/authentication.
- Remote analytics or telemetry.

## Core Functional Requirements
- A new game can be initiated from the landing page.
- Gameplay transitions from landing to active board state.
- Players place marks on valid empty cells only.
- Turn order alternates correctly.
- Win and draw conditions are evaluated after each move.
- Once game over is reached, the UI clearly communicates result state.

## Primary Screens
- Landing page: introductory screen with title/greeting and start-new-game call to action, following the style and structure from `context/example-images/landing_page_exmaple.png`.
- Gameplay page: board-centric screen showing player indicators, active turn/game-over feedback, and controls for replay/navigation, following `context/example-images/gameplay_page_example.png`.

## Stakeholders
- End user: person playing a local Tic-Tac-Toe game in browser.
- Development team: contributors implementing and maintaining the app.
