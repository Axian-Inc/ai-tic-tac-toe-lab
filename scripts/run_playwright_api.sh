#!/usr/bin/env bash
set -euo pipefail

export TEST_REPORT_PREFIX="${TEST_REPORT_PREFIX:-api}"
exec bash scripts/run_playwright_ui.sh "$@"
