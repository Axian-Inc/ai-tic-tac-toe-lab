#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

STACK_NAME="${STACK_NAME:-${S3_WEBSITE_STACK_DEFAULT}}"
BUCKET_NAME="${BUCKET_NAME:-ttt-ms-aj-tic-tac-toe-site}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-${AWS_REGION_DEFAULT}}}"
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

ensure_project_tagged_name "${BUCKET_NAME}" "bucket name"
ensure_project_tagged_name "${STACK_NAME}" "stack name"
require_command aws "AWS CLI is required but not installed."
ensure_file_exists "${TEMPLATE_PATH}"

echo "Deploying stack '${STACK_NAME}' in region '${REGION}' with bucket '${BUCKET_NAME}'..."

aws cloudformation deploy \
  --region "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_PATH}" \
  --parameter-overrides "BucketName=${BUCKET_NAME}" \
  --no-fail-on-empty-changeset

WEBSITE_URL="$(resolve_stack_output "${STACK_NAME}" "${REGION}" "WebsiteURL")"

echo "Deployment complete."
echo "Website URL: ${WEBSITE_URL}"
