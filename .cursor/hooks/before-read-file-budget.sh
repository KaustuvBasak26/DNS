#!/usr/bin/env bash
# Block oversized content chunks from reaching the LLM (Pass 2: per-chunk limit).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
content=$(echo "$input" | jq -r '.content // empty')
file_path=$(echo "$input" | jq -r '.file_path // empty')

[[ -z "$content" ]] && { echo '{"permission":"allow"}'; exit 0; }

max_chunk=$(cfg_int maxReadLimitPerCall 200)
lines=$(printf '%s' "$content" | wc -l | tr -d ' ')

if (( lines <= max_chunk )); then
  echo '{"permission":"allow"}'
  exit 0
fi

jq -n \
  --arg path "$file_path" --argjson lines "$lines" --argjson max "$max_chunk" \
  '{
    permission: "deny",
    user_message: ("Blocked \($path): \($lines) lines sent (max \($max)/read). Use Grep or Read with offset+limit.")
  }'
