# AGENTS — Project Context Memory Bank

## Purpose
Keep lightweight, durable context so contributors (human or AI) can work consistently over time.

## Keeping context current
Update this file when:
- Requirements change (add/modify features, constraints, or priorities).
- Architecture changes (new services, major refactors, data flows).
- Tooling/test workflow changes (new scripts, CI updates).

## Key docs
- `Developer-Stories.md` — source of truth for requirements and acceptance criteria.
- `docs/requirements-phase2.md` — upcoming multiplayer scope (Phase 2).
- `docs/architecture.md` — current system layout and data flows.
- `docs/coding-standards.md` — conventions and quality gates.
- `docs/api-contract.md` — planned API/WebSocket contract for multiplayer.

## Current scope snapshot
- Single-player Tic Tac Toe with deterministic CPU.
- React + TypeScript + Vite UI.
- Terraform-based static hosting (S3 + CloudFront) used for deployment.
- Playwright E2E tests and unit tests run from CLI.
