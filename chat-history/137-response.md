# Response

Built the stateless backend API for Story 003 with Fastify endpoints for `/v1/new-game` and `/v1/move`, validated through shared zod schemas and a deterministic stub AI to keep behavior testable.
- Added backend app + service with logging and error handling in `src/backend/app.ts` and `src/backend/services/gameService.ts`.
- Introduced shared `NewGameRequest` schema for request validation in `src/shared/newGameSchemas.ts` and re-exported via `src/shared/index.ts`.
- Added API tests covering new-game, move flow, invalid input, invalid move, and terminal state in `src/backend/__tests__/api.test.ts`.
- Added Fastify dependencies in `package.json` and updated `package-lock.json`.
- Updated TypeScript node typings in `tsconfig.json` and moved Story 003 to `stories/done/story-003.md`.

Tests: `npm test`.

Next steps:
1. Start Story 004 to replace the stub AI with Bedrock integration.
2. Start Story 005 to build the web UI now that the API exists.
