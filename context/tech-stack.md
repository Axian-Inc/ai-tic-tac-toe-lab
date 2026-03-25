# Tech Stack

## File Index

This file lists the approved technologies used by the project.
It covers the frontend framework and language choices.
It identifies styling, testing, infrastructure, and automation tools.
It serves as the concise source of truth for major dependencies and tool categories.

## Content

Date: 2026-03-19

Frontend:
- React 19
- TypeScript
- Vite
 - Fetch + WebSocket client for multiplayer API integration

Styling:
- CSS (App.css, index.css)

Testing:
- Vitest
- Playwright

Infrastructure:
- Terraform
- AWS CLI

Automation:
- Bash deployment scripts in `/scripts`

Backend:
- Node.js HTTP server (no framework) for multiplayer API endpoints
- WebSocket updates via `ws`
