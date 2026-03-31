# Infrastructure Baseline

## Phase 1 Goal

Phase 1 only needs a low-cost way to deploy a static React build into the Axian L&D AWS account.

The current baseline uses:

- Amazon S3 static website hosting
- CloudFormation for repeatable bucket provisioning
- AWS CLI for packaging and deployment

This is intentionally simple and inexpensive. It is a baseline, not the final Phase 2/3 hosting architecture.

## Files

- `cloudformation/static-site.yml`: provisions the Phase 1 website bucket and enables website hosting
- `deploy-static-site.sh`: builds the app, deploys the stack, reads the bucket output, and syncs `dist/` into S3

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

## Notes

- The generated S3 website endpoint is plain HTTP because this is a minimal Phase 1 baseline.
- A later phase can replace or extend this with CloudFront, TLS, cache policy work, or a more production-like architecture.
- The template keeps the bucket after stack deletion by default through `DeletionPolicy: Retain` so deployment artifacts are not removed accidentally.
