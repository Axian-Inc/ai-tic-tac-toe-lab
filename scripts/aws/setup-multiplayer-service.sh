#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

STACK_NAME="${STACK_NAME:-${MULTIPLAYER_STACK_DEFAULT}}"
REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-${AWS_REGION_DEFAULT}}}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
SERVICE_PORT="${SERVICE_PORT:-${MULTIPLAYER_SERVICE_PORT_DEFAULT}}"
HEALTH_PATH="${HEALTH_PATH:-/health}"
READINESS_PATH="${READINESS_PATH:-/ready}"
TEMPLATE_PATH="infra/multiplayer-service-foundation.yaml"

usage() {
  cat <<USAGE
Usage: $(basename "$0") [-s stack-name] [-r region] [-i instance-type] [-p service-port]

Creates or updates the low-cost AWS infrastructure for the multiplayer backend.

Options:
  -s  CloudFormation stack name (must include ttt-ms-aj)
  -r  AWS region (default: ${REGION})
  -i  EC2 instance type for the multiplayer runtime (default: ${INSTANCE_TYPE})
  -p  Multiplayer service port (default: ${SERVICE_PORT})
USAGE
}

while getopts ":s:r:i:p:h" opt; do
  case "${opt}" in
    s)
      STACK_NAME="${OPTARG}"
      ;;
    r)
      REGION="${OPTARG}"
      ;;
    i)
      INSTANCE_TYPE="${OPTARG}"
      ;;
    p)
      SERVICE_PORT="${OPTARG}"
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
ensure_file_exists "${TEMPLATE_PATH}"

VPC_ID="$(resolve_default_vpc_id "${REGION}")"
SUBNET_ID="$(resolve_default_subnet_id "${REGION}" "${VPC_ID}")"

echo "Deploying multiplayer infrastructure stack '${STACK_NAME}' in region '${REGION}'..."
echo "Using default VPC '${VPC_ID}' and subnet '${SUBNET_ID}'."

aws cloudformation deploy \
  --region "${REGION}" \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE_PATH}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    "ProjectTag=${PROJECT_TAG_DEFAULT}" \
    "VpcId=${VPC_ID}" \
    "SubnetId=${SUBNET_ID}" \
    "InstanceType=${INSTANCE_TYPE}" \
    "ServicePort=${SERVICE_PORT}" \
    "HealthPath=${HEALTH_PATH}" \
    "ReadinessPath=${READINESS_PATH}" \
  --no-fail-on-empty-changeset

echo "Infrastructure deployment complete."
echo "Deployment bucket: $(resolve_stack_output "${STACK_NAME}" "${REGION}" "DeploymentBucketName")"
echo "Backend base URL: $(resolve_stack_output "${STACK_NAME}" "${REGION}" "BackendBaseUrl")"
echo "Backend health URL: $(resolve_stack_output "${STACK_NAME}" "${REGION}" "BackendHealthUrl")"
echo "Backend readiness URL: $(resolve_stack_output "${STACK_NAME}" "${REGION}" "BackendReadinessUrl")"
