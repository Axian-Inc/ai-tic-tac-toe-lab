# Response
Attempted deployment and smoke test. Deployment failed because AWS credentials/account/region are not configured. I fixed a CDK compile error (`BlockPublicAccess.NONE`), but the deploy still cannot proceed without AWS credentials.

- Ran `npm install` in `infra/`.
- `npm run deploy:dev -- --require-approval never --all` failed with: “Unable to resolve AWS account to use. It must be either configured when you define your CDK Stack, or through the environment.”
- `aws sts get-caller-identity` confirmed no credentials are available.

Smoke tests could not run because no Function URL was provisioned.
