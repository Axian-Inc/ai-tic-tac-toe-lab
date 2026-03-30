# Project Overview

## File Index

This file defines the project's purpose, goals, scope, and stakeholders.
It explains the product focus of the tic-tac-toe app.
It records infrastructure and deployment goals that are in scope.
It also marks game-logic changes as out of scope unless explicitly required.

## Content

Date: 2026-03-19
Update: 2026-03-19 - Phase 2 scope adds multiplayer server + client delivery (HTTP + WebSocket), new multiplayer UI flows, and supporting AWS infrastructure/testing.
Update: 2026-03-30 20:31:29 UTC - Phase 3 scope adds spectator viewing of live multiplayer games, code coverage reporting, and pull-request CI automation.

Purpose: Provide a React-based AI tic-tac-toe app with a polished UI and repeatable static-site deployment infrastructure.

Goals:
- Match provided design screenshots for landing and game screens.
- Maintain current behavior and accessibility.
- Provision AWS S3 static hosting through Terraform.
- Automate build and deployment to the provisioned S3 website.

Scope:
- UI layout and styling in React components and CSS.
- Multiplayer server with HTTP API + WebSocket updates, plus client UI to create/join multiplayer games.
- Spectator flows to list active games and watch them in real time without joining as a player.
- Automated coverage reporting and GitHub Actions pull-request checks.
- Terraform configuration for AWS S3 website hosting in the `stanb` workspace.
- No changes to game logic unless explicitly required.

Stakeholders:
- Product/design reviewer
- Engineering
