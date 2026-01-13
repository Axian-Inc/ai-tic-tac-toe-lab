# Epic

## Goal
- Deliver a playable single-player Tic-Tac-Toe POC with an AI opponent, accessible via web UI and CLI, backed by a stateless API and AWS Bedrock integration.

## Success Metrics
- A user can complete a full game (win/lose/draw) via web UI without errors.
- API validates moves and returns consistent state for all requests.
- AI returns legal moves and rationale in a valid JSON schema with retries on invalid output.
- Basic logs include request/session IDs and AI error traces.

## Milestones
- Shared schemas and game rules implemented with tests.
- Stateless API endpoints and error contract defined.
- AI move service integrated with Bedrock and validated.
- Web UI and CLI playable against AI.
- POC deployable (Lambda + Function URL + S3 static hosting).

## Risks
- Bedrock latency or cost exceeds acceptable POC thresholds.
- AI output parsing is brittle without enough deterministic tests.
- Scope creep beyond a minimal playable UI.
