# Response
Prompts aren’t snapshotted directly; they’re exercised indirectly via the AI move service tests.
- `src/backend/__tests__/aiMoveService.test.ts` stubs Bedrock responses and validates parsing, schema enforcement, retries, and must-do logic that bypasses prompts.
- Integration tests in `src/backend/__tests__/api.test.ts` use a stubbed AI service to verify move flow but don’t assert prompt text.

There’s no explicit unit test that asserts the exact prompt string from `buildPrompt(...)`.