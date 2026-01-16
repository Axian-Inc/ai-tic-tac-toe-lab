# Deployment

## Required Environment Variables
- `BEDROCK_REGION` (default: `us-west-2`)
- `BEDROCK_MODEL_ID` (default: `us.anthropic.claude-3-5-haiku-20241022-v1:0`)
- `LOG_LEVEL` (default: `info`)
- `VITE_API_BASE_URL` (default: empty; set to the Function URL for deployed UI builds)

## CDK Bootstrap (one-time per account/region)
- `cd infra`
- `npm install`
- `npx cdk bootstrap aws://ACCOUNT_ID/REGION`

## Deploy (dev)
- `cd infra`
- `BEDROCK_REGION=us-west-2 BEDROCK_MODEL_ID=us.anthropic.claude-3-5-haiku-20241022-v1:0 LOG_LEVEL=info npm run deploy:dev`

## Deploy (prod)
- `cd infra`
- `BEDROCK_REGION=us-west-2 BEDROCK_MODEL_ID=us.anthropic.claude-3-5-haiku-20241022-v1:0 LOG_LEVEL=info npm run deploy:prod`

## Web UI Build + Upload
- `VITE_API_BASE_URL=https://<function-url-host> npm run build:web`
- `aws s3 sync dist/ s3://<web-bucket-name> --delete`

## Smoke Tests
### API
- `curl -s -X POST https://<function-url-host>/v1/new-game \
  -H 'content-type: application/json' \
  -d '{"startingPlayer":"X","opponentId":"balanced"}'`
- Expect HTTP 200 with a JSON body containing:
  - `board`: array of 9 `null`
  - `nextPlayer`: `X`
  - `gameStatus`: `in_progress`
  - `winner`: `null`
  - `opponentId`: `balanced`
  - `sessionId`: string

### Web UI
- Open the `WebBucketUrl` output in a browser and start a new game.
