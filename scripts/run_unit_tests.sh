#!/usr/bin/env bash
set -euo pipefail

mkdir -p reports dist-unit

timestamp="${TEST_REPORT_TIMESTAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
prefix="${TEST_REPORT_PREFIX:-unit}"
log_file="reports/${prefix}-${timestamp}.log"
latest_file="reports/${prefix}-latest.txt"

echo "log=${log_file}" > "$latest_file"
echo "compiled=dist-unit" >> "$latest_file"

echo "Saving ${prefix} test report to ${log_file}"

rm -rf dist-unit
npx tsc -p tsconfig.unit.json

if [[ $# -eq 0 ]]; then
  test_files=(dist-unit/tests/unit/*.test.js)
else
  test_files=()
  for arg in "$@"; do
    if [[ "$arg" == tests/unit/*.test.ts ]]; then
      test_files+=("dist-unit/${arg%.ts}.js")
    elif [[ "$arg" == dist-unit/tests/unit/*.js ]]; then
      test_files+=("$arg")
    else
      test_files+=("$arg")
    fi
  done
fi

node --test "${test_files[@]}" 2>&1 | tee "$log_file"
