#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="${ROOT_DIR}/terraform"
DIST_DIR="${ROOT_DIR}/dist"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command npm
require_command terraform
require_command aws

workspace="$(terraform -chdir="${TERRAFORM_DIR}" workspace show)"
if [[ "${workspace}" != "stanb" ]]; then
  echo "Deployment requires the Terraform workspace to be 'stanb'. Current workspace: ${workspace}" >&2
  exit 1
fi

bucket_name="$(terraform -chdir="${TERRAFORM_DIR}" output -raw bucket_name)"

echo "Building app"
npm run build

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "Build output directory not found: ${DIST_DIR}" >&2
  exit 1
fi

echo "Syncing dist/ to s3://${bucket_name}"
aws s3 sync "${DIST_DIR}/" "s3://${bucket_name}" --delete

echo "Deployment upload complete"
