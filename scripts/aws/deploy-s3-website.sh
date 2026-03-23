#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

STACK_NAME="${STACK_NAME:-${S3_WEBSITE_STACK_DEFAULT}}"
BUCKET_NAME="${BUCKET_NAME:-}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-${AWS_REGION_DEFAULT}}}"
BUILD_DIR="${BUILD_DIR:-dist}"
MULTIPLAYER_STACK_NAME="${MULTIPLAYER_STACK_NAME:-}"
MULTIPLAYER_API_BASE_URL="${MULTIPLAYER_API_BASE_URL:-${VITE_MULTIPLAYER_API_BASE_URL:-}}"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [-b bucket-name] [-s stack-name] [-r region] [-d build-dir] [-m multiplayer-stack-name] [-a multiplayer-api-base-url]

Builds the production app bundle and syncs it to the S3 static website bucket.

Options:
  -b  Bucket name (must include ttt-ms-aj). If omitted, resolves from stack output.
  -s  CloudFormation stack name used to resolve the bucket (default: ${STACK_NAME})
  -r  AWS region (default: ${REGION})
  -d  Build output directory to sync (default: ${BUILD_DIR})
  -m  Multiplayer backend stack used to resolve BackendBaseUrl for Vite build-time injection
  -a  Explicit multiplayer API base URL for Vite build-time injection
USAGE
}

while getopts ":b:s:r:d:m:a:h" opt; do
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
    m)
      MULTIPLAYER_STACK_NAME="${OPTARG}"
      ;;
    a)
      MULTIPLAYER_API_BASE_URL="${OPTARG}"
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

require_command aws "AWS CLI is required but not installed."
require_command npm "npm is required but not installed."

if [[ -z "${BUCKET_NAME}" ]]; then
  echo "Resolving website bucket from stack '${STACK_NAME}' in region '${REGION}'..."
  BUCKET_NAME="$(resolve_stack_output "${STACK_NAME}" "${REGION}" "BucketName")"
fi

ensure_project_tagged_name "${BUCKET_NAME}" "bucket name"
ensure_project_tagged_name "${STACK_NAME}" "stack name"

if [[ -z "${MULTIPLAYER_API_BASE_URL}" && -n "${MULTIPLAYER_STACK_NAME}" ]]; then
  ensure_project_tagged_name "${MULTIPLAYER_STACK_NAME}" "multiplayer stack name"
  echo "Resolving multiplayer API base URL from stack '${MULTIPLAYER_STACK_NAME}' in region '${REGION}'..."
  MULTIPLAYER_API_BASE_URL="$(resolve_stack_output "${MULTIPLAYER_STACK_NAME}" "${REGION}" "BackendBaseUrl")"
fi

echo "Building production bundle with 'npm run build'..."
if [[ -n "${MULTIPLAYER_API_BASE_URL}" ]]; then
  echo "Injecting VITE_MULTIPLAYER_API_BASE_URL='${MULTIPLAYER_API_BASE_URL}' into the frontend build..."
  VITE_MULTIPLAYER_API_BASE_URL="${MULTIPLAYER_API_BASE_URL}" npm run build
else
  npm run build
fi

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
if [[ -n "${MULTIPLAYER_API_BASE_URL}" ]]; then
  echo "Multiplayer API URL: ${MULTIPLAYER_API_BASE_URL}"
fi
