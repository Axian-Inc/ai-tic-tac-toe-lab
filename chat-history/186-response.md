# Response
Attempted to play a full game via the backend API without the UI. The run failed on the first move because `/v1/move` returned `503 AI_UNAVAILABLE` (Bedrock not available), so a full game cannot be completed in the current deployment.

- `POST /v1/new-game` succeeded and returned a valid `GameState`.
- First `POST /v1/move` failed with `{"errorCode":"AI_UNAVAILABLE","message":"AI service is unavailable"}`.

To verify a full game, Bedrock access/model permissions need to be fixed or the backend needs a non-Bedrock fallback opponent for testing.
