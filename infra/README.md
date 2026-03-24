# Infrastructure

## Environment Config

Deployment helper scripts now read their environment-specific values from `dev.yaml`.
Update that file before running any AWS setup or deploy command.

## S3 Static Website (US-16)

This directory contains AWS infrastructure for hosting the app as an S3 static website.

### Files
- `s3-static-website.yaml`: CloudFormation template that creates:
  - S3 bucket with static website hosting enabled
  - `index.html` for index and error documents (SPA-friendly refresh behavior)
  - Public-read policy for objects (`s3:GetObject` only)

### Naming Requirement
The bucket name must include `ttt-ms-aj`.

### Deploy
From the project root:

```bash
npm run aws:s3:setup
```

## App Deployment (US-17)

Build the production app and sync it to the website bucket:

```bash
npm run aws:s3:deploy
```

## Multiplayer Service Foundation (US-30)

Phase 2 expands the backend deployment path at `multiplayer-service-foundation.yaml` into a deployable low-cost runtime.

### Files
- `multiplayer-service-foundation.yaml`: CloudFormation template that creates:
  - one public EC2 runtime for the multiplayer HTTP and websocket server
  - one S3 bucket for versioned backend release bundles
  - IAM and Systems Manager access needed for release automation
  - health and readiness endpoint outputs for operations
- `../scripts/aws/setup-multiplayer-service.ts`: deploys or updates the backend infrastructure stack
- `../scripts/aws/deploy-multiplayer-service.ts`: builds the backend bundle, uploads it, and restarts the deployed runtime through Systems Manager while streaming instance-side deploy output

### Purpose
- Preserve the existing S3 static frontend hosting path while adding one low-cost backend runtime for multiplayer.
- Keep backend release automation independent from frontend releases.
- Stay within the documented Phase 2 cap of 25 concurrent waiting or active multiplayer games without introducing extra managed services.

### Backend Setup

```bash
npm run aws:backend:setup
```

### Backend Deploy

```bash
npm run aws:backend:deploy
```

If `dev.yaml` sets `s3_multiplayer_stack_name`, the frontend deploy resolves
`BackendBaseUrl` from that stack and injects it into
`VITE_MULTIPLAYER_API_BASE_URL` so the deployed S3 site points at the deployed
backend without changing client code.
