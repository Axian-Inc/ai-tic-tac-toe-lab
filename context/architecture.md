# Architecture

## High-Level Overview
- Frontend UI (web UI + CLI, with web UI as primary) connects to a backend game engine.
- Backend exposes AI move service that calls AWS Bedrock for move selection.

## Components
- Frontend: React web UI (primary) plus CLI.
- Game engine: board state, rules, win/draw detection, move validation.
- AI move service: prompt construction + Bedrock inference + move parsing.
- Testing: unit tests for game logic and AI behavior validation.
- AI opponents: start with one Bedrock model and multiple prompt profiles.
- AI responses: structured output with move and brief rationale, validated server-side.
- AI rationale returned in API response for UI display and POC testing.
- AI failure handling: retry on invalid/timeout; return error to UI if retries fail.
- AI behavior tests: schema/legal-move validation plus a small set of deterministic must-do scenarios per opponent profile.
- API shape: single `/move` endpoint for stateless gameplay.
- CLI uses the same stateless backend API as the web UI.

## State Schema (Stateless API)
- board: 9-cell array or 3x3 array with X, O, or null.
- nextPlayer: X or O.
- gameStatus: in_progress, win, or draw.
- winner: X, O, or null.
- opponentId: identifier for selected AI profile/prompt/model.
- moveHistory: optional list of {player, index} for audit/debug and AI context.
- Optional metadata: rulesVersion, requestId/sessionId for tracing.

## State Consistency Rules
- Board length must be 9; values are X, O, or null only.
- Move counts must satisfy: count(X) == count(O) or count(X) == count(O) + 1.
- nextPlayer must be X when count(X) == count(O); O when count(X) == count(O) + 1.
- gameStatus == win requires winner in {X,O} and a valid win line for winner.
- gameStatus == draw requires winner == null and a full board (no nulls).
- gameStatus == in_progress requires winner == null and no win lines exist.

## Data Flow
- Player makes a move in the UI.
- UI sends full game state to backend (stateless API).
- Game engine validates move and updates state.
- AI move service prompts Bedrock with board state, rules, and strategy constraints.
- AI move is parsed and applied; updated state returned to UI.

## Integrations
- AWS Bedrock for LLM inference (region: us-west-2; model: cheap/fast TBD).

## Deployment
- AWS hosting; simplest approach possible for the POC.
- Stateless backend for POC; stateful mode may be added later.
- UI and API remain separately deployable for the POC.
- No auth or rate limiting for the POC (open and simple).
- Basic request logging and Bedrock error tracing required (simple, easily accessible logs).
- Bedrock model selection configurable via environment/config.
- LLM prompt enforces a strict JSON response schema for parsing.
- Configuration details documented in this architecture context.
- Backend validates full state consistency (move counts, winner status, terminal state).
- CORS allows all origins for the POC.
- Error responses use a consistent JSON shape (e.g., errorCode, message, details).
- Basic input size limits enforced for request payloads.
- API uses explicit versioning (e.g., /v1).
- Transport is HTTP/JSON only for the POC (no WebSockets).
- Game rules: classic 3x3 Tic-Tac-Toe, X goes first.
- UI can select starting player/opponent (including random selection).
- API provides `/new-game` to return initial state based on UI selections.
- `/new-game` returns initialized state only; AI-first move is triggered via `/move`.
- Stateless flow includes a lightweight sessionId for logging/trace correlation.
- Opponent profiles embedded in code for the POC.

## Error Contract
- INVALID_INPUT -> HTTP 400 (schema/body shape errors).
- INVALID_MOVE -> HTTP 400 (occupied cell, out of range, wrong turn).
- TERMINAL_STATE -> HTTP 409 (move after win/draw).
- INCONSISTENT_STATE -> HTTP 400 (move counts/nextPlayer/winner mismatch).
- AI_INVALID_OUTPUT -> HTTP 502 (invalid model output after retries).
- AI_TIMEOUT -> HTTP 504 (model timeout after retries).
- AI_UNAVAILABLE -> HTTP 503 (Bedrock errors).

## /v1/new-game Behavior
- Returns empty board, gameStatus=in_progress, winner=null.
- nextPlayer = startingPlayer from request.
- sessionId generated server-side.
- moveHistory omitted until the first move is recorded.
- No automatic AI move on new game; AI move only happens via /v1/move.

## AI Output Parsing
- Require strict JSON with only {moveIndex, rationale}.
- moveIndex must be an integer 0..8 and point to an empty cell.
- rationale is optional; accept empty string.
- Reject extra keys or invalid shape; retry up to 2 times then error.

## Opponent Profiles
- balanced
- aggressive
- defensive
