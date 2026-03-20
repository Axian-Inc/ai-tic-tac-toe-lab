#!/usr/bin/env bash
set -euo pipefail

DEFAULT_IMAGE="mcr.microsoft.com/playwright:v1.52.0-jammy"
VNC_IMAGE="ttt-playwright-vnc:1.52.0"
IMAGE="${PLAYWRIGHT_IMAGE:-$DEFAULT_IMAGE}"
WORKDIR="/work"
VNC_ENABLED="${PLAYWRIGHT_VNC:-0}"
VNC_PORT="${PLAYWRIGHT_VNC_PORT:-5900}"
VNC_PASSWORD="${PLAYWRIGHT_VNC_PASSWORD:-}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required to run Playwright in a container." >&2
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "Run this script from the repository root (package.json not found)." >&2
  exit 1
fi

run_install="${PLAYWRIGHT_SKIP_NPM_INSTALL:-0}"
install_cmd="npm ci"
if [[ "$run_install" == "1" ]]; then
  install_cmd=":"
fi

vnc_args=()
if [[ "$VNC_ENABLED" == "1" ]]; then
  vnc_args+=( -p "${VNC_PORT}:${VNC_PORT}" )
  if [[ -z "${PLAYWRIGHT_IMAGE:-}" ]]; then
    IMAGE="$VNC_IMAGE"
    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
      echo "Building VNC-enabled Playwright image ($IMAGE)..." >&2
      docker build -t "$IMAGE" -f docker/Dockerfile.playwright-vnc .
    fi
  fi
fi

docker run --rm -it \
  --ipc=host \
  "${vnc_args[@]}" \
  -e PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-}" \
  -e PLAYWRIGHT_SKIP_WEB_SERVER="${PLAYWRIGHT_SKIP_WEB_SERVER:-0}" \
  -e PLAYWRIGHT_WEB_SERVER_COMMAND="${PLAYWRIGHT_WEB_SERVER_COMMAND:-}" \
  -e PLAYWRIGHT_WEB_SERVER_URL="${PLAYWRIGHT_WEB_SERVER_URL:-}" \
  -v "$PWD":"$WORKDIR" \
  -w "$WORKDIR" \
  "$IMAGE" \
  bash -lc "$install_cmd && \
    if [[ \"$VNC_ENABLED\" == \"1\" ]]; then \
      export DISPLAY=:99; \
      Xvfb :99 -screen 0 1280x720x24 & \
      if command -v fluxbox >/dev/null 2>&1; then fluxbox & fi; \
      if command -v openbox >/dev/null 2>&1; then openbox & fi; \
      if command -v x11vnc >/dev/null 2>&1; then \
        if [[ -n \"$VNC_PASSWORD\" ]]; then \
          x11vnc -display :99 -forever -shared -rfbport \"$VNC_PORT\" -passwd \"$VNC_PASSWORD\" & \
        else \
          x11vnc -display :99 -forever -shared -rfbport \"$VNC_PORT\" & \
        fi; \
      else \
        echo \"x11vnc not found in container; install it or use default xvfb mode.\" >&2; \
        exit 1; \
      fi; \
      npx playwright test --headed \"\$@\"; \
    else \
      xvfb-run -a npx playwright test --headed \"\$@\"; \
    fi" -- "$@"
