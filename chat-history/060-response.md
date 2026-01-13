# Response
Brief summary of key architecture and project overview decisions:
- POC with path to production; internal team is the stakeholder.
- Both CLI and React web UI supported; UI and API deployed separately.
- Backend is stateless; clients send full game state; backend validates full state consistency.
- API uses `/v1` versioning, a single `/move` endpoint, plus `/new-game` for initialization.
- AI uses Bedrock with a configurable model; one model with multiple prompt profiles; strict JSON response; move + rationale returned; retries then error.
- Testing includes game logic unit tests and AI behavior tests with schema/legal-move checks plus a small set of deterministic scenarios.
