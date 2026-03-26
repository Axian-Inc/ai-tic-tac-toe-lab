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
- Terraform requires `bucket_name`; provide it via `TF_VAR_bucket_name`/`terraform.tfvars` for first-time setup, after which the deploy script can reuse the value from Terraform state.
- Deploy the built site with `npm run deploy:s3`.
- Validate the hosted site with `npm run deploy:validate`.
- Run `npm run deploy` to build, sync `dist/` to S3, and verify the website URL serves HTML.
- Production CORS policy for the multiplayer server should be updated in `server/index.js` via `setCorsHeaders` to allow only the deployed frontend origin(s) instead of `*`.
- Multiplayer server deployment uses a single EC2 instance with systemd and SSM, and uses the public instance URL from Terraform output `server_url`.
- `npm run deploy` applies Terraform, uploads the server code to S3, updates the EC2 instance via SSM, deploys the client to S3, and validates both the website and server health.
- The deploy script exports `VITE_MULTIPLAYER_URL`, `VITE_MULTIPLAYER_WS_URL`, and `VITE_SHOW_API_LOG=false` from Terraform outputs before running the client build.
- The deploy script recreates the `tic-tac-toe-server` systemd unit over SSM before restarting it, so EC2 instances recover even if the service file is missing.
- The deploy script also uploads `package.json` and `package-lock.json` and runs `npm install --omit=dev` on the EC2 instance so the server runtime dependencies are present before restart.

## End-to-End Deployment Steps

These steps deploy the static client and the multiplayer server.

1. Ensure prerequisites:
   - AWS credentials configured for the target account.
   - Terraform and AWS CLI installed.
   - SSM access available in the target AWS account (managed by Terraform).
   - AWS region set via `AWS_REGION` / `AWS_DEFAULT_REGION` or configured in `~/.aws/config`.
   - For the first Terraform apply in a workspace, set `TF_VAR_bucket_name` (or provide `terraform.tfvars`) with a globally unique S3 bucket name.

2. Select the Terraform workspace:
   - `terraform -chdir=terraform workspace select stanb` (or create it if missing).

3. Ensure the multiplayer server EC2 instance can receive SSM commands:
   - The Terraform configuration attaches the required SSM IAM role automatically.

4. Run the deployment script:
   - `npm run deploy` (which runs scripts/deploy.sh)
   - This applies Terraform, uploads the server code to S3, updates the EC2 instance via SSM, builds the client, and uploads `dist/` to S3.

5. Validate the deployment:
   - `npm run deploy:validate` (which runs scripts/validate-hosting.sh)
   - Confirms the S3 website serves HTML and the multiplayer server responds.

6. Capture runtime endpoints for client configuration:
   - `export SERVER_HOME="$(terraform -chdir=terraform output -raw server_url)"`
   - `export WEBSITE_URL="$(terraform -chdir=terraform output -raw website_url)"`
   - Use `SERVER_HOME` as the multiplayer API base URL (set `VITE_MULTIPLAYER_URL`/`VITE_MULTIPLAYER_WS_URL` if needed).
