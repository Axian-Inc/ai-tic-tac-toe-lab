# Story 005

## Title
- Build web UI for single-player game with AI opponent

## Context
- The web UI is the primary user experience for the POC.

## Problem Statement
- Without a web UI, the POC cannot be demoed effectively.

## Inputs
- User inputs: starting player, opponent selection, board cell click.
- API inputs: `/v1/new-game`, `/v1/move` requests.

## Outputs
- UI renders board state, current player, and game status.
- UI displays AI rationale and errors from the API.

## Acceptance Criteria
- [ ] User can start a new game, choose opponent, and play to completion.
- [ ] UI renders a 3x3 board, current player indicator, and status (`in_progress|win|draw`).
- [ ] AI rationale is shown after the AI move (optional toggle is acceptable).
- [ ] API errors render a visible message including `errorCode`.

## Definition of Done
- [ ] Uses shared API client/types from `src/shared`.
- [ ] UI tests cover initial render, new game flow, a valid move flow, and error rendering.
- [ ] Works on desktop and mobile layouts.

## Dependencies
- Story 011 (schemas), Story 003 (API), Story 004 (AI).

## Notes
- Keep UI minimal and focus on clarity over polish.
