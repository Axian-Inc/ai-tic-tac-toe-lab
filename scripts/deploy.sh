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
require_command docker

workspace="$(terraform -chdir="${TERRAFORM_DIR}" workspace show)"
if [[ "${workspace}" != "stanb" ]]; then
  echo "Deployment requires the Terraform workspace to be 'stanb'. Current workspace: ${workspace}" >&2
  exit 1
fi

bucket_name="$(terraform -chdir="${TERRAFORM_DIR}" output -raw bucket_name)"
aws_region="$(terraform -chdir="${TERRAFORM_DIR}" output -raw aws_region)"

if [[ -z "${SERVER_IMAGE:-}" ]]; then
  echo "Missing SERVER_IMAGE env var (container image URI for the multiplayer server)." >&2
  exit 1
fi

server_image="${SERVER_IMAGE}"

echo "Building multiplayer server image"
docker build -t "${server_image}" "${ROOT_DIR}/server"

if [[ "${server_image}" == *".amazonaws.com/"* ]]; then
  aws ecr get-login-password --region "${aws_region}" | docker login --username AWS --password-stdin "${server_image%/*}"
  docker push "${server_image}"
else
  docker push "${server_image}"
fi

echo "Deploying multiplayer server via Terraform"
terraform -chdir="${TERRAFORM_DIR}" apply -auto-approve \
  -var "server_image=${server_image}"

server_url="$(terraform -chdir="${TERRAFORM_DIR}" output -raw server_url)"
echo "Multiplayer server deployed at ${server_url}"

echo "Building app"
export VITE_MULTIPLAYER_URL="${server_url}"
export VITE_MULTIPLAYER_WS_URL="${server_url/http/ws}"
export VITE_SHOW_API_LOG="false"
npm run build

if [[ ! -d "${DIST_DIR}" ]]; then
  echo "Build output directory not found: ${DIST_DIR}" >&2
  exit 1
fi

echo "Syncing dist/ to s3://${bucket_name}"
aws s3 sync "${DIST_DIR}/" "s3://${bucket_name}" --delete

echo "Deployment upload complete"
