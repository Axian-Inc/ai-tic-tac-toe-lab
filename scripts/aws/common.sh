#!/usr/bin/env bash
set -euo pipefail

readonly PROJECT_TAG_DEFAULT="ttt-ms-aj"
readonly AWS_REGION_DEFAULT="us-west-2"
readonly S3_WEBSITE_STACK_DEFAULT="ttt-ms-aj-s3-website"
readonly MULTIPLAYER_STACK_DEFAULT="ttt-ms-aj-multiplayer-service"
readonly MULTIPLAYER_SERVICE_PORT_DEFAULT="3001"

require_command() {
  local command_name="$1"
  local install_hint="$2"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Error: ${install_hint}" >&2
    exit 1
  fi
}

ensure_project_tagged_name() {
  local value="$1"
  local label="$2"

  if [[ "${value}" != *"${PROJECT_TAG_DEFAULT}"* ]]; then
    echo "Error: ${label} must include '${PROJECT_TAG_DEFAULT}'." >&2
    exit 1
  fi
}

ensure_file_exists() {
  local path="$1"

  if [[ ! -f "${path}" ]]; then
    echo "Error: file not found at ${path}" >&2
    exit 1
  fi
}

resolve_stack_output() {
  local stack_name="$1"
  local region="$2"
  local output_key="$3"

  local output_value
  output_value="$(aws cloudformation describe-stacks \
    --region "${region}" \
    --stack-name "${stack_name}" \
    --query "Stacks[0].Outputs[?OutputKey=='${output_key}'].OutputValue" \
    --output text)"

  if [[ -z "${output_value}" || "${output_value}" == "None" ]]; then
    echo "Error: could not resolve stack output '${output_key}' from '${stack_name}'." >&2
    exit 1
  fi

  printf '%s\n' "${output_value}"
}

resolve_default_vpc_id() {
  local region="$1"
  local vpc_id
  vpc_id="$(aws ec2 describe-vpcs \
    --region "${region}" \
    --filters Name=isDefault,Values=true \
    --query 'Vpcs[0].VpcId' \
    --output text)"

  if [[ -z "${vpc_id}" || "${vpc_id}" == "None" ]]; then
    echo "Error: no default VPC found in region '${region}'. Provide a default VPC or update the deployment scripts." >&2
    exit 1
  fi

  printf '%s\n' "${vpc_id}"
}

resolve_default_subnet_id() {
  local region="$1"
  local vpc_id="$2"
  local subnet_id
  subnet_id="$(aws ec2 describe-subnets \
    --region "${region}" \
    --filters Name=vpc-id,Values="${vpc_id}" Name=default-for-az,Values=true \
    --query 'Subnets[0].SubnetId' \
    --output text)"

  if [[ -z "${subnet_id}" || "${subnet_id}" == "None" ]]; then
    echo "Error: no default subnet found in VPC '${vpc_id}' for region '${region}'." >&2
    exit 1
  fi

  printf '%s\n' "${subnet_id}"
}
