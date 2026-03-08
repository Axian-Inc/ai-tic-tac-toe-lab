#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="${STACK_NAME:-ttt-ms-aj-s3-website}"
BUCKET_NAME="${BUCKET_NAME:-}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-west-2}}"
BUILD_DIR="${BUILD_DIR:-dist}"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [-b bucket-name] [-s stack-name] [-r region] [-d build-dir]

Builds the production app bundle and syncs it to the S3 static website bucket.

Options:
  -b  Bucket name (must include ttt-ms-aj). If omitted, resolves from stack output.
  -s  CloudFormation stack name used to resolve the bucket (default: ${STACK_NAME})
  -r  AWS region (default: ${REGION})
  -d  Build output directory to sync (default: ${BUILD_DIR})
USAGE
}

while getopts ":b:s:r:d:h" opt; do
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
    d)
      BUILD_DIR="${OPTARG}"
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

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: AWS CLI is required but not installed." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but not installed." >&2
  exit 1
fi

if [[ -z "${BUCKET_NAME}" ]]; then
  echo "Resolving website bucket from stack '${STACK_NAME}' in region '${REGION}'..."
  BUCKET_NAME="$(aws cloudformation describe-stacks \
    --region "${REGION}" \
    --stack-name "${STACK_NAME}" \
    --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
    --output text)"

  if [[ -z "${BUCKET_NAME}" || "${BUCKET_NAME}" == "None" ]]; then
    echo "Error: could not resolve bucket name from stack '${STACK_NAME}'. Provide -b or deploy infrastructure first." >&2
    exit 1
  fi
fi

if [[ "${BUCKET_NAME}" != *"ttt-ms-aj"* ]]; then
  echo "Error: bucket name must include 'ttt-ms-aj'." >&2
  exit 1
fi

if [[ "${STACK_NAME}" != *"ttt-ms-aj"* ]]; then
  echo "Error: stack name must include 'ttt-ms-aj'." >&2
  exit 1
fi

echo "Building production bundle with 'npm run build'..."
npm run build

if [[ ! -d "${BUILD_DIR}" ]]; then
  echo "Error: build output directory '${BUILD_DIR}' was not created." >&2
  exit 1
fi

echo "Syncing '${BUILD_DIR}' to s3://${BUCKET_NAME} in region '${REGION}'..."
aws s3 sync "${BUILD_DIR}" "s3://${BUCKET_NAME}" \
  --region "${REGION}" \
  --delete

WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com"

echo "Deployment complete."
echo "Bucket: ${BUCKET_NAME}"
echo "Website URL: ${WEBSITE_URL}"
