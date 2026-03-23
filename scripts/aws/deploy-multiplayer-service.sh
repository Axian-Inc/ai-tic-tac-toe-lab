#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

STACK_NAME="${STACK_NAME:-${MULTIPLAYER_STACK_DEFAULT}}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-${AWS_REGION_DEFAULT}}}"
SERVICE_PORT="${SERVICE_PORT:-${MULTIPLAYER_SERVICE_PORT_DEFAULT}}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%d%H%M%S)}"
ARCHIVE_PATH="/tmp/${STACK_NAME}-${RELEASE_ID}.zip"
STAGING_DIR="/tmp/${STACK_NAME}-${RELEASE_ID}"
SSM_PARAMETERS_PATH="/tmp/${STACK_NAME}-${RELEASE_ID}-ssm-parameters.json"

cleanup() {
  rm -rf "${STAGING_DIR}" "${ARCHIVE_PATH}" "${SSM_PARAMETERS_PATH}"
}

print_command_failure() {
  local command_id="$1"
  local instance_id="$2"
  local command_status
  command_status="$(aws ssm get-command-invocation \
    --region "${REGION}" \
    --command-id "${command_id}" \
    --instance-id "${instance_id}" \
    --query "Status" \
    --output text)"

  echo "Error: backend deployment command finished with status '${command_status}'." >&2
  aws ssm get-command-invocation \
    --region "${REGION}" \
    --command-id "${command_id}" \
    --instance-id "${instance_id}" \
    --query "StandardErrorContent" \
    --output text >&2
}

trap cleanup EXIT

usage() {
  cat <<USAGE
Usage: $(basename "$0") [-s stack-name] [-r region] [-p service-port] [-l release-id]

Builds the multiplayer backend bundle, uploads it to AWS, and restarts the
deployed multiplayer runtime through Systems Manager.

Options:
  -s  CloudFormation stack name (must include ttt-ms-aj)
  -r  AWS region (default: ${REGION})
  -p  Multiplayer service port used for post-deploy health verification (default: ${SERVICE_PORT})
  -l  Release identifier used for the uploaded bundle and server release directory
USAGE
}

while getopts ":s:r:p:l:h" opt; do
  case "${opt}" in
    s)
      STACK_NAME="${OPTARG}"
      ;;
    r)
      REGION="${OPTARG}"
      ;;
    p)
      SERVICE_PORT="${OPTARG}"
      ;;
    l)
      RELEASE_ID="${OPTARG}"
      ARCHIVE_PATH="/tmp/${STACK_NAME}-${RELEASE_ID}.zip"
      STAGING_DIR="/tmp/${STACK_NAME}-${RELEASE_ID}"
      SSM_PARAMETERS_PATH="/tmp/${STACK_NAME}-${RELEASE_ID}-ssm-parameters.json"
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

ensure_project_tagged_name "${STACK_NAME}" "stack name"
require_command aws "AWS CLI is required but not installed."
require_command npm "npm is required but not installed."
require_command zip "zip is required but not installed."
ensure_file_exists "package.json"
ensure_file_exists "package-lock.json"

echo "Building backend bundle with 'npm run server:build'..."
npm run server:build

cleanup
mkdir -p "${STAGING_DIR}"
cp -R dist-server "${STAGING_DIR}/dist-server"
cp package.json package-lock.json "${STAGING_DIR}/"

(
  cd "${STAGING_DIR}"
  zip -rq "${ARCHIVE_PATH}" .
)

DEPLOYMENT_BUCKET="$(resolve_stack_output "${STACK_NAME}" "${REGION}" "DeploymentBucketName")"
INSTANCE_ID="$(resolve_stack_output "${STACK_NAME}" "${REGION}" "BackendInstanceId")"
BACKEND_BASE_URL="$(resolve_stack_output "${STACK_NAME}" "${REGION}" "BackendBaseUrl")"
BUNDLE_KEY="releases/${RELEASE_ID}.zip"
BUNDLE_URI="s3://${DEPLOYMENT_BUCKET}/${BUNDLE_KEY}"

echo "Uploading backend release '${RELEASE_ID}' to ${BUNDLE_URI}..."
aws s3 cp "${ARCHIVE_PATH}" "${BUNDLE_URI}" --region "${REGION}"

cat > "${SSM_PARAMETERS_PATH}" <<EOF
{
  "commands": [
    "set -euo pipefail",
    "APP_ROOT=/opt/ttt-multiplayer",
    "RELEASE_DIR=/opt/ttt-multiplayer/releases/${RELEASE_ID}",
    "ARCHIVE_PATH=/tmp/${RELEASE_ID}.zip",
    "NPM_BIN=\$(command -v npm || true)",
    "if [[ -z \"\${NPM_BIN}\" && -x /usr/bin/npm ]]; then NPM_BIN=/usr/bin/npm; fi",
    "if [[ -z \"\${NPM_BIN}\" ]]; then dnf install -y nodejs npm; NPM_BIN=\$(command -v npm || true); fi",
    "if [[ -z \"\${NPM_BIN}\" ]]; then echo 'npm is required on the backend instance but was not found.' >&2; exit 1; fi",
    "rm -rf \"\${RELEASE_DIR}\"",
    "mkdir -p \"\${RELEASE_DIR}\"",
    "aws s3 cp '${BUNDLE_URI}' \"\${ARCHIVE_PATH}\" --region '${REGION}'",
    "unzip -oq \"\${ARCHIVE_PATH}\" -d \"\${RELEASE_DIR}\"",
    "cd \"\${RELEASE_DIR}\"",
    "\"\${NPM_BIN}\" ci --omit=dev",
    "ln -sfn \"\${RELEASE_DIR}\" \"\${APP_ROOT}/current\"",
    "rm -f \"\${ARCHIVE_PATH}\"",
    "systemctl daemon-reload",
    "systemctl enable ttt-multiplayer.service",
    "systemctl restart ttt-multiplayer.service",
    "curl --fail --silent 'http://127.0.0.1:${SERVICE_PORT}/health' >/dev/null"
  ]
}
EOF

echo "Deploying backend release '${RELEASE_ID}' to instance '${INSTANCE_ID}'..."
COMMAND_ID="$(aws ssm send-command \
  --region "${REGION}" \
  --instance-ids "${INSTANCE_ID}" \
  --document-name "AWS-RunShellScript" \
  --comment "Deploy Tic-Tac-Toe multiplayer backend ${RELEASE_ID}" \
  --parameters "file://${SSM_PARAMETERS_PATH}" \
  --query "Command.CommandId" \
  --output text)"

if ! aws ssm wait command-executed \
  --region "${REGION}" \
  --command-id "${COMMAND_ID}" \
  --instance-id "${INSTANCE_ID}"; then
  print_command_failure "${COMMAND_ID}" "${INSTANCE_ID}"
  exit 1
fi

COMMAND_STATUS="$(aws ssm get-command-invocation \
  --region "${REGION}" \
  --command-id "${COMMAND_ID}" \
  --instance-id "${INSTANCE_ID}" \
  --query "Status" \
  --output text)"

if [[ "${COMMAND_STATUS}" != "Success" ]]; then
  print_command_failure "${COMMAND_ID}" "${INSTANCE_ID}"
  exit 1
fi

echo "Backend deployment complete."
echo "Backend base URL: ${BACKEND_BASE_URL}"
echo "Health check: ${BACKEND_BASE_URL}/health"
