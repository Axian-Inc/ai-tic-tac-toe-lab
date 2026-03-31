# Tech Stack

## File Index

This file lists the approved technologies used by the project.
It covers the frontend framework and language choices.
It identifies styling, testing, infrastructure, and automation tools.
It serves as the concise source of truth for major dependencies and tool categories.

## Content

Date: 2026-03-19
Update: 2026-03-30 20:31:29 UTC - Phase 3 adds GitHub Actions-based pull-request automation and terminal-generated coverage reporting requirements.
Update: 2026-03-30 23:20:34 UTC - Coverage reporting is implemented with Vitest's V8 provider and HTML/JSON/text outputs.
Update: 2026-03-31 16:38:23 UTC - Pull-request validation is implemented with a GitHub Actions workflow on `pull_request`.

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
- Coverage reporting via Vitest V8 coverage, invokable from the terminal

Infrastructure:
- Terraform
- AWS CLI
- EC2 + systemd + SSM for multiplayer server hosting

Automation:
- Bash deployment scripts in `/scripts`
- GitHub Actions for pull-request validation

Backend:
- Node.js HTTP server (no framework) for multiplayer API endpoints
- WebSocket updates via `ws`
