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
- [ ] CDK stack defines Lambda + Function URL + IAM + logs and outputs the Function URL.
- [ ] S3 static hosting configured for web UI build output and outputs the bucket name.
- [ ] Deployment steps documented for dev/prod environments with exact commands.
- [ ] Smoke test steps include a sample `/v1/new-game` request and expected 200 response shape.

## Definition of Done
- [ ] Env vars documented in `context/` with defaults.
- [ ] Basic smoke test instructions exist for API and web UI.

## Dependencies
- Story 003 (API), Story 005 (web UI).

## Notes
- Keep infra minimal and aligned with POC goals.
