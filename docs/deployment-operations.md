# Deployment Operations

This document covers the practical deployment and verification workflow for the AWS-hosted multiplayer stack.

## Prerequisites

Required local tools:

- `npm`
- `terraform`
- `aws`

Required AWS access:

- permission to apply Terraform
- permission to upload frontend assets to S3
- permission to create CloudFront invalidations
- permission to inspect Lambda, API Gateway, DynamoDB, and CloudWatch logs as needed

## Provision Infrastructure

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform workspace select jlt || terraform workspace new jlt
terraform plan
terraform apply
```

Useful outputs:

```bash
terraform output -raw backend_http_api_url
terraform output -raw backend_websocket_api_url
terraform output -raw frontend_bucket_name
terraform output -raw frontend_distribution_id
terraform output -raw frontend_domain_name
```

## Build And Publish

From `terraform/environments/dev` after apply:

```bash
export VITE_MULTIPLAYER_API_BASE_URL="$(terraform output -raw backend_http_api_url)"
export VITE_MULTIPLAYER_WS_URL="$(terraform output -raw backend_websocket_api_url)"
export FRONTEND_BUCKET_NAME="$(terraform output -raw frontend_bucket_name)"
export FRONTEND_DISTRIBUTION_ID="$(terraform output -raw frontend_distribution_id)"
```

Then from the repo root:

```bash
npm run build:backend
VITE_MULTIPLAYER_API_BASE_URL="$VITE_MULTIPLAYER_API_BASE_URL" \
VITE_MULTIPLAYER_WS_URL="$VITE_MULTIPLAYER_WS_URL" \
  npm run build
aws s3 sync dist "s3://$FRONTEND_BUCKET_NAME" --delete
aws cloudfront create-invalidation --distribution-id "$FRONTEND_DISTRIBUTION_ID" --paths "/*"
```

## Post-Deploy Verification

Basic checks:

- open the CloudFront frontend URL
- verify the landing page loads
- verify waiting, active, or over multiplayer games can be listed
- create a multiplayer game
- join it from a second browser session
- verify live move updates over WebSocket
- verify replay on page open for active or finished games

HTTP API spot checks:

- `GET /games?status=waiting`
- `GET /games?status=active`
- `GET /games/{id}`

Expected deployment wiring:

- frontend points to the deployed HTTP API base URL
- frontend points to the deployed WebSocket URL
- Lambda functions have the DynamoDB table names and WebSocket management endpoint configured

## Common Failure Modes

Frontend loads but multiplayer requests fail:

- check `VITE_MULTIPLAYER_API_BASE_URL`
- verify CORS allow-origin matches the deployed frontend base URL
- inspect API Gateway HTTP routes and Lambda logs

Frontend loads but live updates do not arrive:

- check `VITE_MULTIPLAYER_WS_URL`
- inspect API Gateway WebSocket connect/disconnect behavior
- verify `WEBSOCKET_MANAGEMENT_ENDPOINT` is set in the Lambda environment
- inspect the `connections` table for active records

Game links work but `links.gameUrl` is `null`:

- check whether `FRONTEND_BASE_URL` is set for the backend Lambda package

CloudFront still serves old assets:

- verify the `aws s3 sync` upload succeeded
- verify the CloudFront invalidation completed
- hard-refresh the browser and confirm the latest asset names are served

Unexpected stale-game behavior:

- inspect game timestamps in DynamoDB
- verify abandonment checks are being triggered through reads or explicit abandonment requests

## Where To Look In AWS

- Lambda: handler logs and environment variables
- API Gateway HTTP API: route and integration configuration
- API Gateway WebSocket API: connect/disconnect/default route behavior
- DynamoDB:
  - `games`
  - `game-events`
  - `connections`
- CloudFront: distribution status and invalidations
- S3: deployed `dist/` assets

## Operational Notes

- The backend enforces a limit of 25 non-terminal games
- WebSocket connections are also cleaned up passively through TTL on the `connections` table
- Replay hydration comes from `GET /games/{id}`, not from WebSocket backfill
- The current PR workflow validates build, unit tests, and coverage, but not deployed-environment behavior
