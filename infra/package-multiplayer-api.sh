#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="${ARTIFACT_DIR:-.artifacts}"
ARTIFACT_PATH="${ARTIFACT_DIR}/multiplayer-api.tgz"

mkdir -p "${ARTIFACT_DIR}"

echo "Packaging multiplayer API artifact at ${ARTIFACT_PATH}..."
tar -czf "${ARTIFACT_PATH}" \
  package.json \
  package-lock.json \
  tsconfig.json \
  server \
  shared \
  src/features/game/model

echo "${ARTIFACT_PATH}"
