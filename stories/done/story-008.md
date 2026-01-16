# Story 008

## Title
- Provision POC infrastructure and deployment steps

## Context
- The POC must be deployable for internal demo without manual setup.

## Problem Statement
- Without repeatable infra, the POC cannot be shared or validated.

## Inputs
- CDK configuration for `dev` and `prod` environments.
- Env vars: `BEDROCK_REGION`, `BEDROCK_MODEL_ID`, `LOG_LEVEL`, `VITE_API_BASE_URL`.

## Outputs
- Stack outputs: Function URL and S3 bucket name for web hosting.
- Documented deploy and smoke test steps.

## Acceptance Criteria
- [x] CDK stack defines Lambda + Function URL + IAM + logs and outputs the Function URL.
- [x] S3 static hosting configured for web UI build output and outputs the bucket name.
- [x] Deployment steps documented for dev/prod environments with exact commands.
- [x] Smoke test steps include a sample `/v1/new-game` request and expected 200 response shape.

## Assumptions/Questions
- [x] Use npm for infra commands to match the repo `package-lock.json`.

## Plan
- [x] Create an `infra/` CDK app with API + web stacks and outputs.
- [x] Add a Lambda handler entrypoint for the Fastify app.
- [x] Document environment variables, deploy steps, and smoke tests in context.

## Definition of Done
- [x] Env vars documented in `context/` with defaults.
- [x] Basic smoke test instructions exist for API and web UI.

## Dependencies
- Story 003 (API), Story 005 (web UI).

## Notes
- Keep infra minimal and aligned with POC goals.
- Tests not run (infra and deployment documentation changes only).

## Done
- CDK infra, handler entrypoint, and deployment documentation in place.
