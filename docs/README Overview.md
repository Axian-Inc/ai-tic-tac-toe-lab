# Tic Tac Toe -- Axian LnD Project

## Overview

This project is a local-only Tic Tac Toe game built using:

-   React
-   TypeScript
-   Vite
-   Terraform (IaC)
-   Playwright (E2E testing)
-   Vitest (Unit testing)

The game allows a user to play against a deterministic CPU opponent. The
CPU always plays "O" and only moves when the user explicitly presses a
"CPU Move" button.

The application emphasizes:

-   Clean separation of UI and business logic
-   Strong automated testing (unit + E2E)
-   Deterministic behavior
-   High-quality developer experience
-   Infrastructure as Code
-   CLI-first workflows
-   Deployment to Axian's LnD AWS Account (S3 static hosting)

## Features

### Game Features

-   Player is always "X"
-   CPU is always "O"
-   Deterministic CPU opponent
-   Illegal moves prevented in UI and logic
-   Visual hover feedback for valid moves
-   Sound effects (thud, win, lose)
-   Confetti animation on win
-   "Try Again" message on loss
-   Rematch option after game finishes
-   Ability to quit a game mid-play

## Exit Criteria

-   App deployed to Axian LnD AWS account (S3)
-   Terraform provisions infrastructure
-   Unit tests runnable via CLI
-   Playwright script completes full game including win condition
-   Project fully documented
