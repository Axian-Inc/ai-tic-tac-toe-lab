# Response
Bedrock LLM prompts are built in `src/backend/services/aiMoveService.ts`.
- `opponentProfiles` holds the per-opponent promptStyle strings.
- `buildPrompt(...)` assembles the full prompt sent to Bedrock (used by InvokeModel).