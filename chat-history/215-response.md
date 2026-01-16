# Response
Project discovery complete. Found source in `src/backend`, `src/shared`, `src/web`, `src/cli`; tests live under `src/**/__tests__` with `*.test.ts`/`*.test.tsx` (including `.integration.test.ts`); framework is `vitest` with coverage and `@testing-library/react` + `user-event` for UI.

Module inventory for confirmation:
- **Controllers/Routes:** `src/backend/app.ts` (Fastify `/v1/new-game`, `/v1/move`), `src/backend/handler.ts` (Lambda adapter).
- **Services/Business Logic:** `src/backend/services/gameService.ts` (state transitions + AI orchestration), `src/backend/services/aiMoveService.ts` (prompting, must-do logic, Bedrock calls), `src/shared/gameRules.ts` (validate/apply moves, compute status).
- **Models/Data Layer:** `src/shared/gameState.ts` (GameState schema), `src/shared/newGameSchemas.ts`, `src/shared/moveSchemas.ts` (request/response/error schemas).
- **Utils/Helpers:** `src/shared/apiClient.ts` (client + response parsing), `src/cli/client.ts` (request builders), `src/cli/cli.ts` (arg parsing, formatting, IO helpers).
- **Integration Points:** AWS Bedrock in `src/backend/services/aiMoveService.ts`, Fastify/Lambda in `src/backend/app.ts`/`src/backend/handler.ts`, HTTP API usage in `src/shared/apiClient.ts` and `src/cli/client.ts`.
- **UI Layer:** `src/web/App.tsx`, `src/web/main.tsx`, `src/web/App.css` (React UI).

Confirm this inventory (and any reordering), and tell me which module to analyze first.
