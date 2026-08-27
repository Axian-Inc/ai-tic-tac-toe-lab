# Project Brief

Status: source requirement
Versioned: 2026-08-26

## Summary

Build a small Tic-Tac-Toe game using coordinated agents. Application,
quality, and documentation/delivery work are separate responsibilities. The
documentation agent may configure CI/CD. Missing documentation makes a
feature or approach incomplete.

## Architecture direction

The client is a Vite React application. A small API backend is introduced in
Phase 2; C# is preferred. The repository must be treated as a first-class
application with setup, architecture, behavior, testing, delivery, and
operations documentation.

## Source control and work records

The current orchestration decision supersedes the source brief's original
branch prefix: all agents branch from and merge through `zebanaya-kepler` and
use `{agent-name}/{branch-name}`. Commits follow Conventional Commits. Work is
recorded as Markdown tickets under `docs/tickets/`, rather than GitHub issues.
