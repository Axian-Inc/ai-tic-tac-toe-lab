# Deployment

## File Index

This file documents deployment-related commands and constraints.
It covers the local build and preview commands for the app.
It records where Terraform infrastructure lives.
It states the required Terraform workspace for infrastructure work.
It lists the script-based deployment and hosting validation commands.

## Content

Date: 2026-03-19
Update: 2026-03-30 17:34:11 UTC - Simplified the end-to-end deployment section to list only required operator steps and clarified that the deploy script injects runtime endpoints into the client build automatically.

Notes:
- Vite build via `npm run build`.
- Preview via `npm run preview`.
- Infrastructure is defined in `/terraform`.
- Select or create the `stanb` workspace before planning or applying Terraform.
- The Terraform configuration intentionally fails in the `default` workspace.
- Terraform now relies on the AWS provider's standard region resolution, so it follows `AWS_REGION`, then `AWS_DEFAULT_REGION`, then the active profile/shared config in `~/.aws/config`.
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

These are the only required operator steps to deploy the static client and multiplayer server from this repository.

1. Ensure prerequisites:
   - AWS credentials configured for the target account with permission to run Terraform, S3 operations, and SSM commands.
   - Terraform, AWS CLI, Node.js, and npm installed locally.
   - AWS region configured through `AWS_REGION`, `AWS_DEFAULT_REGION`, or `~/.aws/config`.
   - For the first apply in a workspace, set `TF_VAR_bucket_name` (or provide `terraform.tfvars`) with a globally unique S3 bucket name.

2. Select the Terraform workspace:
   - `terraform -chdir=terraform workspace select stanb`
   - If it does not exist yet, create it first with `terraform -chdir=terraform workspace new stanb`.

3. Install project dependencies:
   - `npm install`

4. Run the end-to-end deployment:
   - `npm run deploy` or `./scripts/deploy.sh`
   - This script applies Terraform, waits for the EC2 instance to become reachable through SSM, uploads the multiplayer server files, recreates/reloads the systemd service on the instance, exports `VITE_MULTIPLAYER_URL`, `VITE_MULTIPLAYER_WS_URL`, and `VITE_SHOW_API_LOG=false`, builds the client, and syncs `dist/` to the website S3 bucket.
   - No separate manual step is required to prepare SSM on the EC2 instance; Terraform attaches the required IAM role and the deploy script waits until SSM reports the instance online.

5. Validate the deployed system:
   - `npm run deploy:validate`
   - This checks that the website URL serves HTML and that the multiplayer server responds on `/games?status=waiting`.

6. (Optional) Retrieve the deployed endpoints if you need to open or share them:
   - `terraform -chdir=terraform output -raw website_url` - share with other users who want to play Tic-Tac-Toe on your new system.
   - `terraform -chdir=terraform output -raw server_url` - not necessarily need unless you want to allow others to call API directly.
   - These outputs are informational after deployment. They are not a required configuration step because `npm run deploy` already reads `server_url` from Terraform and bakes the correct client API/WebSocket endpoints into the built frontend before uploading it to S3.
