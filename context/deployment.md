# Deployment

## File Index

This file documents deployment-related commands and constraints.
It covers the local build and preview commands for the app.
It records where Terraform infrastructure lives.
It states the required Terraform workspace for infrastructure work.
It lists the script-based deployment and hosting validation commands.

## Content

Date: 2026-03-19

Notes:
- Vite build via `npm run build`.
- Preview via `npm run preview`.
- Infrastructure is defined in `/terraform`.
- Select or create the `stanb` workspace before planning or applying Terraform.
- The Terraform configuration intentionally fails in the `default` workspace.
- Deploy the built site with `npm run deploy:s3`.
- Validate the hosted site with `npm run deploy:validate`.
- Run `npm run deploy` to build, sync `dist/` to S3, and verify the website URL serves HTML.
- Production CORS policy for the multiplayer server should be updated in `server/index.js` via `setCorsHeaders` to allow only the deployed frontend origin(s) instead of `*`.
- Multiplayer server deployment requires setting `server_image` (container image URI) and uses an ALB URL from Terraform output `server_url`.
- `npm run deploy` builds and pushes the server image, applies Terraform with `server_image`, deploys the client to S3, and validates both the website and server health.
- Set `SERVER_IMAGE` before running deploy (for example an ECR or public registry URI) so the scripts can build and push the multiplayer server container.
- The deploy script exports `VITE_MULTIPLAYER_URL`, `VITE_MULTIPLAYER_WS_URL`, and `VITE_SHOW_API_LOG=false` from Terraform outputs before running the client build.

## End-to-End Deployment Steps

These steps deploy the static client and the multiplayer server.

1. Ensure prerequisites:
   - AWS credentials configured for the target account.
   - Terraform and AWS CLI installed.
   - Docker installed and running.

2. Select the Terraform workspace:
   - `terraform -chdir=terraform workspace select stanb` (or create it if missing).

3. Set required variables for Terraform and deployment:
   - `export SERVER_IMAGE="<registry>/<repo>:<tag>"`
     - This is the container image URI used by ECS Fargate.

4. Run the deployment script:
   - `npm run deploy`
   - This builds and pushes the server image, applies Terraform, builds the client, and uploads `dist/` to S3.

5. Validate the deployment:
   - `npm run deploy:validate`
   - Confirms the S3 website serves HTML and the multiplayer server responds.

6. Capture runtime endpoints for client configuration:
   - `export SERVER_HOME="$(terraform -chdir=terraform output -raw server_url)"`
   - `export WEBSITE_URL="$(terraform -chdir=terraform output -raw website_url)"`
   - Use `SERVER_HOME` as the multiplayer API base URL (set `VITE_MULTIPLAYER_URL`/`VITE_MULTIPLAYER_WS_URL` if needed).
