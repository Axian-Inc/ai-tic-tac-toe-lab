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
- `us.anthropic.claude-3-5-haiku-20241022-v1:0` (fast response for a POC, no Marketplace subscription required).

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
- IaC: AWS CDK (TypeScript) for defining Lambda, Function URL, IAM, and logs.
- Web UI: static hosting in S3 (public bucket) for the POC.

## Minimal AWS Pieces (POC)
- Lambda function: Node.js 18 runtime, handler for `/v1/new-game` and `/v1/move`.
- Function URL: public access, CORS allow `*`, allow `POST` (preflight handled by Function URL).
- IAM role for Lambda:
  - Basic execution (CloudWatch Logs).
  - Bedrock invoke permission for chosen model(s).
- CloudWatch logs: default log group for the function.
- Env vars: `BEDROCK_REGION`, `BEDROCK_MODEL_ID`, `LOG_LEVEL`.
- Optional: request ID/session ID propagated in logs for traceability.

## IaC Structure (POC)
- Tooling: AWS CDK (TypeScript).
- Location: `/infra` workspace package.
- Stacks: `ApiStack` for Lambda + Function URL + IAM + logs; `WebStack` for S3 static hosting.
- Environments: `dev` and `prod` via CDK context or env vars (no multi-account).
- Deployment: `cd infra && npm run deploy:dev` (use `deploy:prod` for production).

## Web UI Hosting (POC)
- S3 bucket configured for static website hosting (public read).
- Bucket policy allows `s3:GetObject` for `*` on the site bucket.
- Build + upload: `npm run build:web` then `aws s3 sync dist/ s3://<bucket> --delete`.
- API base URL configured via env at build time (e.g., `VITE_API_BASE_URL`).

## Repo Layout
- Monorepo with all source under `/src`:
  - `src/backend` (Lambda API)
  - `src/web` (React UI)
  - `src/cli` (CLI client)
  - `src/shared` (schemas/types/API client)

## Package Manager
- `npm` with `package-lock.json` (single workspace).

## Shared Types and Validation
- `zod` schemas live in `src/shared` and are reused by backend, web, and CLI.

## Open Items
- Prompt profiles per opponent.
