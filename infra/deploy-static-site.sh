#!/usr/bin/env bash
set -euo pipefail

: "${STACK_NAME:?STACK_NAME is required}"
: "${SITE_BUCKET_NAME:?SITE_BUCKET_NAME is required}"

AWS_REGION="${AWS_REGION:-us-west-2}"
TEMPLATE_PATH="infra/cloudformation/static-site.yml"

echo "Building application bundle..."
npm run build

echo "Deploying CloudFormation stack ${STACK_NAME} in ${AWS_REGION}..."
aws cloudformation deploy \
  --region "${AWS_REGION}" \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_PATH}" \
  --parameter-overrides "SiteBucketName=${SITE_BUCKET_NAME}"

echo "Resolving deployment outputs..."
DEPLOYED_BUCKET_NAME="$(aws cloudformation describe-stacks \
  --region "${AWS_REGION}" \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" \
  --output text)"

SITE_URL="$(aws cloudformation describe-stacks \
  --region "${AWS_REGION}" \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='SiteUrl'].OutputValue" \
  --output text)"

echo "Syncing dist/ to s3://${DEPLOYED_BUCKET_NAME}..."
aws s3 sync dist/ "s3://${DEPLOYED_BUCKET_NAME}" \
  --region "${AWS_REGION}" \
  --delete

echo "Deployment complete."
echo "Site bucket: ${DEPLOYED_BUCKET_NAME}"
echo "Website URL: ${SITE_URL}"
