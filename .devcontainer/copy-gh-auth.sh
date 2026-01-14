#!/usr/bin/env bash
set -euo pipefail

HOST_DIR="/tmp/host-gh"
TARGET_DIR="${HOME}/.config/gh"

if [ -d "${HOST_DIR}" ]; then
  mkdir -p "${TARGET_DIR}"
  cp -R "${HOST_DIR}/." "${TARGET_DIR}/"
  chmod 700 "${TARGET_DIR}"
  find "${TARGET_DIR}" -type f -exec chmod 600 {} +
  echo "Copied GitHub CLI auth from ${HOST_DIR} to ${TARGET_DIR}"
else
  echo "GitHub CLI auth not found at ${HOST_DIR}."
  echo "Copy ~/.config/gh from the host into the container at ${TARGET_DIR}."
fi
