# Response
Added CDK infra scaffolding for the API Lambda/Function URL and web hosting, plus a Fastify Lambda handler and deployment docs aligned with npm.

- `infra/bin/app.ts`, `infra/lib/api-stack.ts`, `infra/lib/web-stack.ts` add CDK stacks for Lambda + Function URL + Bedrock IAM + logs and S3 static hosting with outputs.
- `src/backend/handler.ts` adds the Lambda entrypoint and `src/backend/app.ts` now accepts logger options for `LOG_LEVEL`.
- `context/deployment.md` documents env vars, deploy commands, and smoke tests; updated `context/tech-stack.md`, `context/known-issues.md`, and `docs/PROJECT_OVERVIEW.md`; moved `stories/done/story-008.md`.
- Dependency/ignore updates in `package.json`, `package-lock.json`, and `.gitignore`.

Tests not run (infra/docs-only changes).

Next steps:
1. `cd infra && npm install` then `npm run deploy:dev` to provision the dev stacks.
2. `VITE_API_BASE_URL=<function-url> npm run build:web` and `aws s3 sync dist/ s3://<web-bucket-name> --delete`.
3. Run the `/v1/new-game` smoke test from `context/deployment.md`.
