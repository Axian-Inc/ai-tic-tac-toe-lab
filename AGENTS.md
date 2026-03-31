# AGENTS.md

## Purpose

This repository is a staged lab for building and deploying a Tic Tac Toe system with AI assistance across planning, implementation, testing, infrastructure, and documentation.

Agents should use this file as the default operating guide for work in this repo.

## Canonical Inputs

Read these first before changing code:

- `README.md`: local environment, dev container, Codex auth, AWS CLI, and git setup.
- `phases/phase-1/phase-1.md`: single-player React + TypeScript game requirements.
- `phases/phase-2/phase-2.md`: multiplayer HTTP/WebSocket server requirements and infrastructure expansion.
- `phases/phase-3/phase-3.md`: spectator flow, code coverage, and CI pipeline requirements.
- `phases/**.png`: visual reference assets for each phase.

When requirements are ambiguous, prefer the newest relevant phase doc while preserving earlier phase exit criteria.

## Current State

As checked into this repository today:

- The repo now contains an implemented React client, multiplayer Node server, spectator flow, coverage command, and pull request workflow.
- `package.json` defines the active local build, test, coverage, packaging, and deployment scripts used by the project today.
- `codex-cli` exists but is empty and should not be treated as application code.
- `node_modules/` is dependency output, not source.
- The user may add substantial work between turns; always re-check the tree before making assumptions.

## Delivery Model

## Phase Execution Discipline

This project is strictly executed one phase at a time.

- Use later phase documents to inform planning only.
- Do not implement work from a future phase before the current phase is completed and accepted.
- After each meaningful milestone, stop for user testing and explicit acceptance before continuing.
- Do not batch multiple phase goals together just because the future requirements are already known.
- When unsure whether something belongs to the current phase or a later one, defer it and call it out clearly.

The project evolves in phases and each later phase builds on the previous one:

- Phase 1: local-only single-player game with deterministic CPU, game module tests, audio/visual feedback, Playwright coverage, and deployment/IaC foundations.
- Phase 2: multiplayer support through an HTTP API server plus WebSocket event delivery, with replayable game state, resign/abandonment handling, and capacity limits.
- Phase 3: spectator mode, terminal-generated coverage, and a GitHub Actions PR pipeline.

Do not regress earlier phase behavior when implementing later phases.

## Implementation Expectations

Prefer a conventional structure as the app is built out, for example:

- `src/` for client and shared code.
- `server/` or `api/` for HTTP/WebSocket backend.
- `tests/` and/or colocated `*.test.*` files for unit coverage.
- `playwright/` or `e2e/` for browser tests.
- `infra/` for IaC.
- `docs/` or root markdown files for architecture and workflow notes.

If the existing codebase chooses a different structure, follow the established pattern instead of forcing a rewrite.

## Guardrails

- Do not edit `node_modules/`.
- Do not use `codex-cli` unless the user explicitly turns it into a real script.
- Keep single-player functionality working while adding multiplayer and spectator features.
- Make command-line execution first class. Tests, coverage, builds, and Playwright runs should be callable from package scripts or similarly obvious terminal commands.
- Preserve move history and determinism where the brief requires it.
- Keep server validation authoritative for multiplayer moves and game state changes.
- Favor low-cost AWS infrastructure choices when working on deployment or IaC.

## Testing Priorities

Every meaningful feature change should consider the phase exit criteria and maintain automation:

- Unit tests for core game logic.
- Server tests for multiplayer rules, abandonment, resignation, and concurrency limits.
- Playwright coverage for end-to-end playable flows.
- Coverage generation from the terminal by Phase 3.
- Build/test automation suitable for CI.

If a new script is introduced, document it in `README.md`.

## Documentation Expectations

Agents are expected to keep documentation current, not as an afterthought.

Update docs when changing:

- setup steps,
- architecture,
- project organization,
- coding standards,
- package scripts,
- infrastructure,
- testing workflows,
- CI behavior.

Phase 2 explicitly calls out AI-assisted documentation and project memory. Keep repository guidance concise, practical, and aligned with the real codebase.

## Work Log Requirement

Maintain a root-level `LD-WorkLog.md` throughout this project.

- Treat it as a detailed step-by-step record of what is being built during this effort.
- Update it continuously as work happens, not only at the end.
- Capture meaningful implementation progress, decisions, course corrections, commands/scripts added, tests run, issues found, and fixes made.
- Write entries clearly enough that the full build process can be reviewed in detail afterward.
- When completing a substantial task, update `LD-WorkLog.md` as part of the same change unless the user explicitly says otherwise.

## Session Learnings

Capture durable process learnings in `AGENTS.md` when they will help future work in this repository.

- Record practical lessons that reduce repeated mistakes, wasted motion, or avoidable retries.
- When updating important docs such as `AGENTS.md`, use a reliable edit flow and verify the file contents immediately after the change.
- Prefer making one precise change, then reading the affected section back before moving on.
- Do not repeat the same failed update approach multiple times without changing method.
- When taking over another person's requirements, review the relevant UI or workflow first and confirm what the major named components are before implementing changes.
- Establish a quick working lexicon for ambiguous terms already in use by the human, such as `status bar`, so shared terminology matches the actual product surface before code changes begin.
- If a requested term could reasonably map to more than one UI element, verify the target against the existing interface and prefer the smallest change that proves the interpretation is correct.
- After the user accepts a story, create a git checkpoint commit before moving into the next accepted milestone unless the user explicitly says not to.

## Working Style

- Re-scan the repo before major edits because this workspace is actively changing.
- Prefer small, reviewable patches over broad churn.
- Use fast search tools such as `rg`.
- Preserve unrelated user changes in the worktree.
- When adding new tooling, include the smallest viable configuration that satisfies the phase requirements.
