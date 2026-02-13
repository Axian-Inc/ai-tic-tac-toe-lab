#!/usr/bin/env bash
set -euo pipefail

repo_url="$(terraform -chdir=terraform output -raw server_ecr_repository_url)"
cluster_name="$(terraform -chdir=terraform output -raw server_ecs_cluster_name)"
service_name="$(terraform -chdir=terraform output -raw server_ecs_service_name)"

registry="${repo_url%/*}"

aws ecr get-login-password --region "${AWS_REGION:-us-west-2}" \
  | docker login --username AWS --password-stdin "${registry}"

docker buildx build --platform linux/amd64 \
  -t "${repo_url}:latest" \
  --push \
  server

aws ecs update-service \
  --cluster "${cluster_name}" \
  --service "${service_name}" \
  --force-new-deployment >/dev/null

aws ecs wait services-stable \
  --cluster "${cluster_name}" \
  --services "${service_name}"

echo "Server deployed. API base URL: $(terraform -chdir=terraform output -raw server_api_base_url)"
