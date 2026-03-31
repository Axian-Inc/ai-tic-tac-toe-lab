#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="${ROOT_DIR}/terraform"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command terraform
require_command curl

workspace="$(terraform -chdir="${TERRAFORM_DIR}" workspace show)"
if [[ "${workspace}" != "stanb" ]]; then
  echo "Hosting validation requires the Terraform workspace to be 'stanb'. Current workspace: ${workspace}" >&2
  exit 1
fi

website_url="$(terraform -chdir="${TERRAFORM_DIR}" output -raw website_url)"
server_url="$(terraform -chdir="${TERRAFORM_DIR}" output -raw server_url)"
response_file="$(mktemp)"
trap 'rm -f "${response_file}"' EXIT

echo "Checking ${website_url}"
http_code="$(curl -sS -o "${response_file}" -w "%{http_code}" "${website_url}")"

if [[ "${http_code}" != "200" ]]; then
  echo "Unexpected HTTP status ${http_code} from ${website_url}" >&2
  cat "${response_file}" >&2
  exit 1
fi

if ! grep -qi "<title>" "${response_file}"; then
  echo "Hosted page did not contain an HTML <title> tag" >&2
  exit 1
fi

echo "Hosting validation passed for ${website_url}"

echo "Checking ${server_url}/games?status=waiting"
server_code="$(curl -sS -o "${response_file}" -w "%{http_code}" "${server_url}/games?status=waiting")"

if [[ "${server_code}" != "200" ]]; then
  echo "Unexpected HTTP status ${server_code} from ${server_url}/games?status=waiting" >&2
  cat "${response_file}" >&2
  exit 1
fi

echo "Multiplayer server validation passed for ${server_url}"
