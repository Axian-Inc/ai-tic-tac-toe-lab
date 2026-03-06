#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-ttt-ms-aj-s3-website}"
BUCKET_NAME="${BUCKET_NAME:-ttt-ms-aj-tic-tac-toe-site}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"
TEMPLATE_PATH="infra/s3-static-website.yaml"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [-b bucket-name] [-s stack-name] [-r region]

Creates or updates the S3 static website infrastructure for Tic-Tac-Toe.

Options:
  -b  Bucket name (must include ttt-ms-aj)
  -s  CloudFormation stack name (must include ttt-ms-aj)
  -r  AWS region (default: ${REGION})
USAGE
}

while getopts ":b:s:r:h" opt; do
  case "${opt}" in
    b)
      BUCKET_NAME="${OPTARG}"
      ;;
    s)
      STACK_NAME="${OPTARG}"
      ;;
    r)
      REGION="${OPTARG}"
      ;;
    h)
      usage
      exit 0
      ;;
    :)
      echo "Error: option -${OPTARG} requires an argument." >&2
      usage
      exit 1
      ;;
    \?)
      echo "Error: invalid option -${OPTARG}" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "${BUCKET_NAME}" != *"ttt-ms-aj"* ]]; then
  echo "Error: bucket name must include 'ttt-ms-aj'." >&2
  exit 1
fi

if [[ "${STACK_NAME}" != *"ttt-ms-aj"* ]]; then
  echo "Error: stack name must include 'ttt-ms-aj'." >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: AWS CLI is required but not installed." >&2
  exit 1
fi

if [[ ! -f "${TEMPLATE_PATH}" ]]; then
  echo "Error: template not found at ${TEMPLATE_PATH}" >&2
  exit 1
fi

echo "Deploying stack '${STACK_NAME}' in region '${REGION}' with bucket '${BUCKET_NAME}'..."

aws cloudformation deploy \
  --region "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_PATH}" \
  --parameter-overrides "BucketName=${BUCKET_NAME}" \
  --no-fail-on-empty-changeset

WEBSITE_URL="$(aws cloudformation describe-stacks \
  --region "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" \
  --output text)"

echo "Deployment complete."
echo "Website URL: ${WEBSITE_URL}"
