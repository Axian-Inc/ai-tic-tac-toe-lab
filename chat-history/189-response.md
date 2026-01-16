# Response
Switched the backend to Claude 3.5 Haiku via the `us.anthropic.claude-3-5-haiku-20241022-v1:0` inference profile, confirmed Bedrock invocation works, added a deterministic must-do fallback, redeployed, and verified a full game completes via the API.

- Bedrock `InvokeModel` with `us.anthropic.claude-3-5-haiku-20241022-v1:0` succeeds.
- Updated defaults in `infra/lib/api-stack.ts`, `context/tech-stack.md`, and `context/deployment.md`.
- Added must-do short-circuit in `src/backend/services/aiMoveService.ts` and test coverage in `src/backend/__tests__/aiMoveService.test.ts`.
- Redeployed `TicTacToeApi-dev`.
- Full game played via backend API to terminal state (O wins) with valid JSON responses.

Tests run: `npm test -- src/backend/__tests__/aiMoveService.test.ts`.
