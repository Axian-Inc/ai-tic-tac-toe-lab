#!/usr/bin/env bash
set -euo pipefail

: "${STACK_NAME:?STACK_NAME is required}"
: "${API_ARTIFACT_BUCKET_NAME:?API_ARTIFACT_BUCKET_NAME is required}"

AWS_REGION="${AWS_REGION:-us-west-2}"
API_INSTANCE_TYPE="${API_INSTANCE_TYPE:-t3.micro}"
API_PORT="${API_PORT:-8787}"
ALLOWED_API_CIDR="${ALLOWED_API_CIDR:-0.0.0.0/0}"
TEMPLATE_PATH="infra/cloudformation/multiplayer-api.yml"

ARTIFACT_PATH="$(bash ./infra/package-multiplayer-api.sh)"
ARTIFACT_KEY="${API_ARTIFACT_KEY:-artifacts/multiplayer-api-$(date -u +%Y%m%d%H%M%S).tgz}"

echo "Uploading multiplayer API artifact to s3://${API_ARTIFACT_BUCKET_NAME}/${ARTIFACT_KEY}..."
aws s3 cp "${ARTIFACT_PATH}" "s3://${API_ARTIFACT_BUCKET_NAME}/${ARTIFACT_KEY}" \
  --region "${AWS_REGION}"

echo "Deploying CloudFormation stack ${STACK_NAME} in ${AWS_REGION}..."
aws cloudformation deploy \
  --region "${AWS_REGION}" \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_PATH}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    "ApiArtifactBucketName=${API_ARTIFACT_BUCKET_NAME}" \
    "ApiArtifactKey=${ARTIFACT_KEY}" \
    "ApiInstanceType=${API_INSTANCE_TYPE}" \
    "ApiPort=${API_PORT}" \
    "AllowedApiCidr=${ALLOWED_API_CIDR}"

API_BASE_URL="$(aws cloudformation describe-stacks \
  --region "${AWS_REGION}" \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiBaseUrl'].OutputValue" \
  --output text)"

echo "Multiplayer API deployment complete."
echo "Artifact: s3://${API_ARTIFACT_BUCKET_NAME}/${ARTIFACT_KEY}"
echo "API URL: ${API_BASE_URL}"
