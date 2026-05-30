#!/usr/bin/env bash
# Tab inline completion read guard (Pass 3).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
file_path=$(echo "$input" | jq -r '.file_path // empty')
content=$(echo "$input" | jq -r '.content // empty')

if [[ -n "$file_path" && -f "$file_path" && "$(cfg blockBinaryFileReads true)" == "true" ]] && is_binary_file "$file_path"; then
  echo '{"permission":"deny"}'
  exit 0
fi

max_chunk=$(cfg_int maxReadLimitPerCall 200)
if [[ -n "$content" ]]; then
  lines=$(printf '%s' "$content" | wc -l | tr -d ' ')
  if (( lines > max_chunk )); then
    echo '{"permission":"deny"}'
    exit 0
  fi
fi

echo '{"permission":"allow"}'
