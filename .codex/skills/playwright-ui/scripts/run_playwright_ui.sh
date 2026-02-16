#!/usr/bin/env bash
set -euo pipefail

mode="${1:-test}"
if [[ $# -gt 0 ]]; then
  shift
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run Playwright commands."
  exit 1
fi

case "$mode" in
  test)
    exec npx playwright test "$@"
    ;;
  ui)
    exec npx playwright test --ui "$@"
    ;;
  headed)
    exec npx playwright test --headed "$@"
    ;;
  debug)
    exec npx playwright test --debug "$@"
    ;;
  trace)
    exec npx playwright test --trace=on "$@"
    ;;
  list)
    exec npx playwright test --list "$@"
    ;;
  report)
    exec npx playwright show-report "$@"
    ;;
  *)
    cat <<'EOF'
Usage: scripts/run_playwright_ui.sh <mode> [playwright args...]

Modes:
  test     Run tests (default)
  ui       Run Playwright UI mode
  headed   Run in headed browser mode
  debug    Run with Playwright inspector
  trace    Run with trace capture enabled
  list     List tests
  report   Open Playwright HTML report
EOF
    exit 2
    ;;
esac

