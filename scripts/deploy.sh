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

terraform_output() {
  terraform -chdir="${TERRAFORM_DIR}" output -raw "$1" 2>/dev/null || true
}

workspace="$(terraform -chdir="${TERRAFORM_DIR}" workspace show)"
if [[ "${workspace}" != "stanb" ]]; then
  echo "Deployment requires the Terraform workspace to be 'stanb'. Current workspace: ${workspace}" >&2
  exit 1
fi

bucket_name="${TF_VAR_bucket_name:-$(terraform_output bucket_name)}"
if [[ -z "${bucket_name}" ]]; then
  echo "Missing Terraform variable bucket_name. Set TF_VAR_bucket_name or provide terraform.tfvars for the selected workspace." >&2
  exit 1
fi

export TF_VAR_bucket_name="${bucket_name}"
aws_region="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"

if [[ -z "${aws_region}" ]]; then
  aws_region="$(aws configure get region)"
fi

if [[ -z "${aws_region}" ]]; then
  echo "Missing AWS region. Set AWS_REGION/AWS_DEFAULT_REGION or configure ~/.aws/config." >&2
  exit 1
fi

echo "Deploying multiplayer server via Terraform"
terraform -chdir="${TERRAFORM_DIR}" apply -auto-approve

bucket_name="$(terraform_output bucket_name)"
server_instance_id="$(terraform -chdir="${TERRAFORM_DIR}" output -raw server_instance_id)"
server_url="$(terraform -chdir="${TERRAFORM_DIR}" output -raw server_url)"
server_port="${server_url##*:}"
echo "Uploading server code to s3://${bucket_name}/server/index.js"
aws s3 cp "${ROOT_DIR}/server/index.js" "s3://${bucket_name}/server/index.js"
echo "Uploading package manifests to s3://${bucket_name}/server/"
aws s3 cp "${ROOT_DIR}/package.json" "s3://${bucket_name}/server/package.json"
aws s3 cp "${ROOT_DIR}/package-lock.json" "s3://${bucket_name}/server/package-lock.json"

echo "Updating multiplayer server instance via SSM"
echo "Waiting for SSM to report instance online"
for attempt in {1..30}; do
  status="$(aws ssm describe-instance-information \
    --region "${aws_region}" \
    --filters Key=InstanceIds,Values="${server_instance_id}" \
    --query "InstanceInformationList[0].PingStatus" \
    --output text 2>/dev/null || true)"
  if [[ "${status}" == "Online" ]]; then
    break
  fi
  sleep 10
done

if [[ "${status:-}" != "Online" ]]; then
  echo "SSM did not report the instance online. Try again in a minute." >&2
  exit 1
fi

bootstrap_script="$(mktemp)"
trap 'rm -f "${bootstrap_script}"' EXIT

cat >"${bootstrap_script}" <<EOF
#!/usr/bin/env bash
set -euo pipefail

mkdir -p /opt/ai-tic-tac-toe/server

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
fi

cat <<'UNIT' > /etc/systemd/system/tic-tac-toe-server.service
[Unit]
Description=AI Tic Tac Toe Multiplayer Server
After=network.target

[Service]
WorkingDirectory=/opt/ai-tic-tac-toe
Environment=PORT=${server_port}
ExecStart=/usr/bin/node /opt/ai-tic-tac-toe/server/index.js
Restart=always
RestartSec=2
ConditionPathExists=/opt/ai-tic-tac-toe/server/index.js

[Install]
WantedBy=multi-user.target
UNIT

aws s3 cp s3://${bucket_name}/server/index.js /opt/ai-tic-tac-toe/server/index.js
aws s3 cp s3://${bucket_name}/server/package.json /opt/ai-tic-tac-toe/package.json
aws s3 cp s3://${bucket_name}/server/package-lock.json /opt/ai-tic-tac-toe/package-lock.json
cd /opt/ai-tic-tac-toe
npm install --omit=dev
systemctl daemon-reload
systemctl enable tic-tac-toe-server
systemctl restart tic-tac-toe-server
EOF

bootstrap_script_b64="$(base64 < "${bootstrap_script}" | tr -d '\n')"
command_id="$(aws ssm send-command \
  --region "${aws_region}" \
  --instance-ids "${server_instance_id}" \
  --document-name "AWS-RunShellScript" \
  --comment "Deploy multiplayer server" \
  --parameters "{\"commands\":[\"printf %s '${bootstrap_script_b64}' | base64 -d > /tmp/tic-tac-toe-deploy.sh\",\"bash /tmp/tic-tac-toe-deploy.sh\"]}" \
  --query "Command.CommandId" \
  --output text)"

aws ssm wait command-executed --region "${aws_region}" --command-id "${command_id}" --instance-id "${server_instance_id}"

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
