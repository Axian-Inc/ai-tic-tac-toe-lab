#!/usr/bin/env bash
set -euo pipefail

command="${1:-test}"
shift || true

mkdir -p playwright-report

timestamp="${TEST_REPORT_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
prefix="${TEST_REPORT_PREFIX:-}"
if [[ -z "$prefix" ]]; then
  joined_args=" $* "
  if [[ "$joined_args" == *"/specs/api/"* ]]; then
    prefix="api"
  else
    prefix="ui"
  fi
fi

export TEST_REPORT_PREFIX="$prefix"
export TEST_REPORT_TIMESTAMP="$timestamp"

html_dir="playwright-report/${prefix}-${timestamp}-html"
results_dir="playwright-report/${prefix}-${timestamp}-results"

echo "Saving ${prefix} HTML report to ${html_dir}"
echo "Saving ${prefix} test artifacts to ${results_dir}"

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
    report_path="${PLAYWRIGHT_HTML_REPORT:-$html_dir}"
    npx playwright show-report "$report_path"
    ;;
  *)
    echo "Usage: $0 {test|ui|headed|debug|trace|report} -- [args]" >&2
    exit 2
    ;;
esac
