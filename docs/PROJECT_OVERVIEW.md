# Project Overview

## Purpose
Build a POC single-player Tic-Tac-Toe game with an AI opponent. The web UI is primary, with a CLI client for quick testing.

## Key Architectural Decisions (and Why)
- **Node.js + TypeScript + Fastify for the API**: aligns with the React frontend, fast iteration, and shared typing via `zod`.
- **React + Vite for the web UI**: lightweight build/dev loop without server-side rendering requirements.
- **Stateless API**: game state is carried in each request to simplify deployment (no DB required).
- **Shared schemas and API client in `src/shared`**: single source of truth for validation and request/response shapes.
- **AWS Bedrock integration**: LLM-driven AI moves with strict JSON output parsing and retries.

## Main User Flows
- **Start new game**: Web UI/CLI calls `POST /v1/new-game` -> API returns initial `GameState`.
- **Make a move**: Web UI/CLI calls `POST /v1/move` with `GameState` + move index -> API validates -> AI move via Bedrock -> updated state returned with `aiRationale`.

## Critical Paths and Bottlenecks
- **Bedrock inference**: external network call with retries; timeouts or invalid JSON responses block move completion.
- **State validation**: strict `zod` parsing and rule checks must succeed on every request.
- **Client-driven state**: correctness depends on client sending the latest `GameState`.

## Known Technical Debt Areas
- **No persistence**: game state is not stored server-side; replay/auditing is limited to the client payload.
- **No authentication or rate limiting**: POC assumes open access.
- **Manual IaC deployment**: CDK stacks live in `infra/`, but deployment remains manual.
- **No CI/CD pipeline**: deployment appears manual via local scripts.
- **Limited observability**: structured logs exist, but no tracing/metrics pipeline is defined.

## Integration Complexity Map
- **Most fragile**: AWS Bedrock invocation (strict JSON output, retries, timeout handling).
- **Moderate**: API client validation (shared schemas must stay in sync across web/CLI/backend).
- **Low**: Web UI build and static hosting (pure client bundle).

## Quick Reference: Change Impact
- **Game rules**: update `src/shared/gameRules.ts` plus related tests in `src/shared/__tests__`.
- **Game state schema**: update `src/shared/gameState.ts`; impacts API validation and UI state rendering.
- **API contracts**: update `src/shared/moveSchemas.ts` and `src/shared/newGameSchemas.ts`; also touches `src/backend/app.ts` and clients.
- **AI behavior**: update `src/backend/services/aiMoveService.ts` and backend AI tests.
- **Backend endpoints**: update `src/backend/app.ts` and API tests in `src/backend/__tests__`.
- **Web UI**: update `src/web/App.tsx` and UI tests in `src/web/__tests__`.
- **CLI**: update `src/cli/client.ts` and CLI tests in `src/cli/__tests__`.
