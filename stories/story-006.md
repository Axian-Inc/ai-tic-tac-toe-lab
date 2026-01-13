# Story 006

## Title
- Implement CLI client for playing against AI

## Context
- CLI provides a secondary way to exercise the API and validate game flow.

## Problem Statement
- Without a CLI, quick manual testing and demos are slower.

## Inputs
- CLI command: `ttt play --api-base-url <url> --opponent <id> --starting-player X|O`.
- User input for move index (0-8).

## Outputs
- Plain text board rendering, status updates, and error output with `errorCode`.

## Acceptance Criteria
- [ ] CLI can start a game, prompt for moves, and display board state after each move.
- [ ] CLI uses the same API endpoints as the web UI.
- [ ] CLI prints errors in the format `ERROR <errorCode>: <message>`.

## Definition of Done
- [ ] Uses shared API client/types from `src/shared`.
- [ ] CLI tests cover argument parsing, one happy-path flow, and one error case using mocked API responses.

## Dependencies
- Story 001 (schemas), Story 003 (API), Story 004 (AI).

## Notes
- Keep output plain text; no rich TUI.
