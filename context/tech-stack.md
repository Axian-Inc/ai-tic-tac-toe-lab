# Tech Stack Decisions

## Goals
- Ship a POC fast with minimal ops overhead.
- Keep one primary language across backend, web, and CLI.
- Ensure AWS Bedrock integration is straightforward.
- Keep the API and validation simple and well-tested.

## Evaluation Criteria
- Speed to implement and iterate.
- Ease of Bedrock integration and AWS tooling.
- Shared types and validation between layers.
- Simple deployment path for a stateless API.
- Low cognitive overhead for the team.

## Backend Options Considered
- Node.js + TypeScript (Fastify/Express).
- Python (FastAPI).
- Go (chi/net/http).

## Backend Choice
- Node.js + TypeScript + Fastify.
- Rationale: aligns with the React frontend, enables shared types, strong AWS SDK v3 support, and fast iteration.

## Backend Libraries
- Validation: `zod` for request/response validation and schema sharing.
- Logging: `pino` with request logging.
- AWS: `@aws-sdk/client-bedrock-runtime` (v3).
- Testing: `vitest` for unit tests.
- Lambda adapter: `@fastify/aws-lambda` for Function URL integration.

## Bedrock Model (POC)
- `anthropic.claude-3-haiku-20240307-v1:0` (lowest cost/fast response for a POC).

## Web Options Considered
- React + Vite + TypeScript.
- Next.js (more infra than needed for a POC).

## Web Choice
- React + Vite + TypeScript.
- Rationale: lightweight, fast build/dev loop, no SSR requirement.

## Web Libraries
- UI: minimal CSS (no UI framework) for POC.
- Testing: `vitest` + `@testing-library/react` for unit-level UI tests.

## CLI Options Considered
- Node.js + TypeScript.
- Python (click/typer).

## CLI Choice
- Node.js + TypeScript.
- Rationale: shared types and API client with backend and web.

## CLI Libraries
- CLI framework: `commander`.
- HTTP: `fetch` (Node 18+) or `undici` fallback if needed.
- Output: plain text; no rich TUI.
 - Build: `tsup` for a single-file CLI build.

## Deployment Notes (POC)
- Target: AWS.
- API: single stateless Lambda with Function URL (lowest cost/simplest path).
- Logging: basic request logging and Bedrock error traces.

## Minimal AWS Pieces (POC)
- Lambda function: Node.js 18 runtime, handler for `/v1/new-game` and `/v1/move`.
- Function URL: public access, CORS allow `*`, allow `POST, OPTIONS`.
- IAM role for Lambda:
  - Basic execution (CloudWatch Logs).
  - Bedrock invoke permission for chosen model(s).
- CloudWatch logs: default log group for the function.
- Env vars: `BEDROCK_REGION`, `BEDROCK_MODEL_ID`, `LOG_LEVEL`.
- Optional: request ID/session ID propagated in logs for traceability.

## Repo Layout
- Monorepo with all source under `/src`:
  - `src/backend` (Lambda API)
  - `src/web` (React UI)
  - `src/cli` (CLI client)
  - `src/shared` (schemas/types/API client)

## Package Manager
- `pnpm` with workspaces for faster installs and shared deps.

## Shared Types and Validation
- `zod` schemas live in `src/shared` and are reused by backend, web, and CLI.

## Open Items
- Prompt profiles per opponent.
