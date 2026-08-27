# Phase 3 Requirements

Status: source requirement
Versioned: 2026-08-26

## Product behavior

- Add a Spectate action that lists active games and displays one in real time.
- Let a spectator obtain current state and receive later WebSocket updates.
- Let the server list games in progress.
- Generate a code coverage report from the terminal.
- Add a GitHub Actions pull-request pipeline that runs unit tests and
  builds/packages the application.

## Acceptance criteria

- The server reports in-progress games.
- The client connects to a selected game as a spectator.
- CI compiles/bundles, tests, and reports coverage.
