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
- [x] CLI can start a game, prompt for moves, and display board state after each move.
- [x] CLI uses the same API endpoints as the web UI.
- [x] CLI prints errors in the format `ERROR <errorCode>: <message>`.

## Definition of Done
- [x] Uses shared API client/types from `src/shared`.
- [x] CLI tests cover argument parsing, one happy-path flow, and one error case using mocked API responses.

## Dependencies
- Story 011 (schemas), Story 003 (API), Story 004 (AI).

## Notes
- Keep output plain text; no rich TUI.
- Tests run: `npm test -- src/cli/__tests__/cli.test.ts`.
- CLI entrypoint: `npm run cli -- play --api-base-url <url> --opponent <id> --starting-player X|O`.

## Assumptions/Questions
- [x] Clarify whether starting player `O` is expected to be supported despite game-rule validation enforcing `X` as the first move; CLI follows API behavior unless otherwise directed.

## Plan
- [x] Add failing CLI tests for argument parsing, a happy-path play loop, and an error response.
- [x] Implement CLI argument parsing, board rendering, and interactive play loop using shared API client/types.
- [x] Wire a runnable CLI entrypoint and ensure errors print `ERROR <errorCode>: <message>`.
- [x] Verify tests and update story checklists/notes.

## Done
- CLI play loop implemented with board rendering, prompts, and API error formatting.
