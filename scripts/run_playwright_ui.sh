#!/usr/bin/env bash
set -euo pipefail

command="${1:-test}"
shift || true

case "$command" in
  test)
    npx playwright test "$@"
    ;;
  ui)
    npx playwright test --ui "$@"
    ;;
  headed)
    npx playwright test --headed "$@"
    ;;
  debug)
    npx playwright test --debug "$@"
    ;;
  trace)
    npx playwright test --trace=on "$@"
    ;;
  report)
    npx playwright show-report
    ;;
  *)
    echo "Usage: $0 {test|ui|headed|debug|trace|report} -- [args]" >&2
    exit 2
    ;;
esac
