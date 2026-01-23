#!/usr/bin/env bash
set -euo pipefail

AWS_REGION=${AWS_REGION:-us-west-2}
AWS_PROFILE=${AWS_PROFILE:-}
S3_BUCKET=${S3_BUCKET:-tic-tac-toe-dev-tg-site}
CLOUDFRONT_DISTRIBUTION_ID=${CLOUDFRONT_DISTRIBUTION_ID:-E2OIVQ7L1EG91H}
DIST_DIR=${DIST_DIR:-dist}

if [[ ! -d "$DIST_DIR" ]]; then
  echo "Build directory '$DIST_DIR' not found. Run 'npm run build' first." >&2
  exit 1
fi

AWS_CLI_ARGS=(--region "$AWS_REGION")
if [[ -n "$AWS_PROFILE" ]]; then
  AWS_CLI_ARGS+=(--profile "$AWS_PROFILE")
fi

aws "${AWS_CLI_ARGS[@]}" s3 sync "$DIST_DIR" "s3://$S3_BUCKET" \
  --delete \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --cache-control "no-cache, no-store, must-revalidate"

aws "${AWS_CLI_ARGS[@]}" s3 sync "$DIST_DIR" "s3://$S3_BUCKET" \
  --delete \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable"

aws "${AWS_CLI_ARGS[@]}" cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  > /tmp/cloudfront-invalidation.json

echo "Deployment complete. Invalidation details saved to /tmp/cloudfront-invalidation.json"
