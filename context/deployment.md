# Deployment

Last updated: 2026-03-16

## Phase 1

### AWS S3 Static Website (US-16)
- Infrastructure template: `infra/s3-static-website.yaml`
- Setup script: `scripts/aws/setup-s3-website.sh`
- npm command: `npm run aws:s3:setup`

### AWS S3 Build and Deploy (US-17)
- Deployment script: `scripts/aws/deploy-s3-website.sh`
- npm command: `npm run aws:s3:deploy`
- Deployment flow:
  - Builds production assets with `npm run build`
  - Resolves the bucket from stack `ttt-ms-aj-s3-website` by default
  - Syncs `dist/` to the S3 website bucket with deletion of removed files

### Optional Overrides
- `BUCKET_NAME=ttt-ms-aj-your-unique-site npm run aws:s3:deploy`
- `STACK_NAME=ttt-ms-aj-s3-website-usw2 AWS_REGION=us-west-2 npm run aws:s3:deploy`
- `BUILD_DIR=dist npm run aws:s3:deploy`

### Deployed Resources
- CloudFormation stack: `ttt-ms-aj-s3-website`
- S3 bucket: `ttt-ms-aj-tic-tac-toe-site`
- Region: `us-west-2`
- Website URL: `http://ttt-ms-aj-tic-tac-toe-site.s3-website-us-west-2.amazonaws.com`

### Configuration Notes
- Bucket static website hosting is enabled.
- `index.html` is configured as both index and error document to support SPA route refresh behavior.
- Public access is limited to object reads through bucket policy (`s3:GetObject` on bucket objects).
- Naming guardrails require `ttt-ms-aj` in stack and bucket names.

## Phase 2

### Deployment Direction
- Phase 1 S3 static website hosting remains in place for the frontend.
- Deployment scope expands to include a multiplayer backend API and websocket endpoint.
- Infrastructure as code must be updated before Phase 2 deployment is considered complete.

### Deployment Constraints
- Phase 2 deployment should remain low cost on AWS.
- Frontend and backend deployment paths should stay independently deployable so stories can ship incrementally.
- Capacity guardrail for multiplayer remains 25 concurrent active or waiting games.

### US-30 Foundation Commands
- Frontend and backend local start together: `npm run dev:full`
- Backend local build: `npm run server:build`
- Backend local start: `npm run server:start`
- Backend service defaults:
  - Host: `0.0.0.0`
  - Port: `3001`
  - Health endpoint: `/health`
  - Readiness endpoint: `/ready`
- Backend IaC foundation template: `infra/multiplayer-service-foundation.yaml`

### US-31 Local Multiplayer Discovery
- The landing page multiplayer lobby UI calls the backend API directly from the browser.
- Default local backend base URL: `http://localhost:3001`
- Optional frontend override for non-local or deployed API targets:
  - `VITE_MULTIPLAYER_API_BASE_URL=https://your-api.example.com npm run dev`
  - `VITE_MULTIPLAYER_API_BASE_URL=https://your-api.example.com npm run build`
- Backend currently serves in-memory multiplayer lobbies only; restarting the service clears waiting games.

### US-32 Local Join Flow
- Multiplayer setup now uses these backend endpoints locally:
  - `POST /games` to create a waiting game with host player `X`
  - `GET /games?status=waiting` to discover joinable games
  - `POST /games/{id}/join` to assign player `O` and move the game to `active`
  - `GET /games/{id}` to refresh the authoritative multiplayer setup snapshot
- The frontend gameplay route now carries multiplayer session state in browser history so the created or joined player enters gameplay in the correct role without breaking the existing single-player route.
- Local verification for US-32 is covered by `npm run typecheck` and `npm run build`.

### US-33 Local Authoritative Move Flow
- Multiplayer gameplay now adds `POST /games/{id}/moves` for HTTP-driven authoritative move submission before websocket fan-out exists.
- The frontend gameplay route also persists multiplayer session details in the URL query (`mode`, `gameId`, `player`) so a page refresh can recover the session and reload current authoritative state through `GET /games/{id}`.
- Local verification for US-33 is covered by `npm run typecheck` and `npm run build`.

### US-34 Local Websocket Sync
- The multiplayer backend now exposes `WS /ws?gameId=...` on the same host and port as the HTTP API.
- The frontend derives websocket endpoint configuration from `VITE_MULTIPLAYER_API_BASE_URL`, converting the HTTP API origin into `ws://` or `wss://` automatically.
- Websocket delivery is additive: HTTP create/join/move and `GET /games/{id}` recovery remain the fallback path when live sync is unavailable.
- Local verification for US-34 is covered by `npm run typecheck` and `npm run build`.

### US-35 Local Resignation Flow
- Multiplayer gameplay now adds `POST /games/{id}/resign` as an intentional early-exit endpoint for active games.
- Resignation updates are delivered through both the existing HTTP detail path (`GET /games/{id}`) and the existing websocket fan-out path so refreshed and subscribed clients observe the same completed state.
- Local verification for US-35 is covered by `npm run typecheck` and `npm run build`.

### US-36 Local Spectator Flow
- Multiplayer discovery now includes active-game spectating through the existing backend endpoints:
  - `GET /games?status=active` for discoverable live matches.
  - `GET /games/{id}` for initial spectator hydration.
  - `WS /ws?gameId=...` for live spectator updates.
- The frontend gameplay route now supports multiplayer spectator session state in browser history and URL query parameters without changing existing player routes.
- Local verification for US-36 is covered by `npm run typecheck` and `npm run build`.

### US-37 Local Replay and Catch-Up Retention
- Multiplayer replay and catch-up continue to use the existing backend detail and websocket surfaces:
  - `GET /games/{id}` returns ordered move history via `game.state.moves` plus retained lifecycle events via `game.history.events`.
  - `WS /ws?gameId=...` continues to push authoritative snapshots that include the same retained history metadata.
- Phase 2 retention remains in-memory for the current single-process backend deployment:
  - Retained move/event history survives reconnects while the service process stays up.
  - Retained move/event history is lost if the backend process restarts or is redeployed.
- Local verification for US-37 is covered by `npm run typecheck` and `npm run build`.
