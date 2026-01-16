#!/usr/bin/env bash
set -euo pipefail

source_dir="${SOURCE_DIR:-.codex/prompts}"
dest_dir="${DEST_DIR:-$HOME/.codex/prompts}"

if [ ! -d "$source_dir" ]; then
  echo "Source directory not found: $source_dir" >&2
  exit 1
fi

mkdir -p "$dest_dir"
cp -a "$source_dir"/. "$dest_dir"/
