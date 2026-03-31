# Infrastructure Baseline

## Phase 1 Goal

Phase 1 only needs a low-cost way to deploy a static React build into the Axian L&D AWS account.

The current baseline uses:

- Amazon S3 static website hosting
- CloudFormation for repeatable bucket provisioning
- AWS CLI for packaging and deployment

This is intentionally simple and inexpensive. It is a baseline, not the final Phase 2/3 hosting architecture.

## Phase 2 Goal

Phase 2 adds a low-cost baseline for the multiplayer API alongside the static frontend.

The current multiplayer deployment baseline uses:

- the existing S3 static-site hosting path for the browser app
- a single Amazon EC2 instance for the Node-based multiplayer API
- CloudFormation for repeatable infrastructure provisioning
- AWS CLI plus a packaged application tarball for deployment

## Files

- `cloudformation/static-site.yml`: provisions the Phase 1 website bucket and enables website hosting
- `deploy-static-site.sh`: builds the app, deploys the stack, reads the bucket output, and syncs `dist/` into S3
- `cloudformation/multiplayer-api.yml`: provisions the low-cost EC2-based multiplayer API host
- `package-multiplayer-api.sh`: packages the server runtime artifact for upload
- `deploy-multiplayer-api.sh`: uploads the multiplayer API artifact and deploys the API stack

## Required Inputs

Before deployment, configure AWS credentials in the dev container:

```bash
aws configure
```

Required environment variables:

- `STACK_NAME`: CloudFormation stack name
- `SITE_BUCKET_NAME`: globally unique S3 bucket name

Optional environment variables:

- `AWS_REGION`: defaults to `us-west-2`

For the multiplayer API deployment, configure:

- `STACK_NAME`: CloudFormation stack name for the API stack
- `API_ARTIFACT_BUCKET_NAME`: S3 bucket used to store the packaged API tarball

Optional variables:

- `API_ARTIFACT_KEY`: object key for the uploaded artifact
- `API_INSTANCE_TYPE`: defaults to `t3.micro`
- `API_PORT`: defaults to `8787`
- `ALLOWED_API_CIDR`: defaults to `0.0.0.0/0`

## Deploy

From the repo root:

```bash
STACK_NAME=ai-tic-tac-toe-phase1 \
SITE_BUCKET_NAME=your-unique-bucket-name \
npm run deploy:static
```

The script will:

1. build the app
2. deploy the CloudFormation stack
3. look up the website bucket name from the stack output
4. sync the `dist/` directory to S3
5. print the website URL

## Deploy Multiplayer API

From the repo root:

```bash
STACK_NAME=ai-tic-tac-toe-phase2-api \
API_ARTIFACT_BUCKET_NAME=your-artifact-bucket \
npm run deploy:server
```

The server deployment flow will:

1. package the multiplayer API source into a tarball
2. upload the artifact to S3
3. deploy the Phase 2 CloudFormation stack
4. create or update a low-cost EC2 instance that runs the multiplayer API through `systemd`
5. print the resulting API base URL

## Notes

- The generated S3 website endpoint is plain HTTP because this is a minimal Phase 1 baseline.
- A later phase can replace or extend this with CloudFront, TLS, cache policy work, or a more production-like architecture.
- The template keeps the bucket after stack deletion by default through `DeletionPolicy: Retain` so deployment artifacts are not removed accidentally.
- The Phase 2 API baseline is intentionally simple and cost-conscious. It is suitable for lab validation, not production traffic.
- The API host installs dependencies at instance boot time and runs the TypeScript server with `tsx`; a later phase can replace this with a more production-like image or build pipeline.
- The Phase 3 pull request workflow validates `npm run package:server`, so the packaging path is now part of routine repo automation even though deployment still happens manually.
