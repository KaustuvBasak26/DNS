#!/usr/bin/env bash
# Auto-cap unbounded Read calls; cap explicit limits too (Pass 2).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
path=$(echo "$input" | jq -r '.tool_input.path // .tool_input.target_file // empty')
limit=$(echo "$input" | jq -r '.tool_input.limit // empty')
offset=$(echo "$input" | jq -r '.tool_input.offset // empty')

[[ -z "$path" || ! -f "$path" ]] && { allow_pre; exit 0; }

if [[ "$(cfg blockBinaryFileReads true)" == "true" ]] && is_binary_file "$path"; then
  deny_pre "Binary file ${path}. Use a text parser or Grep; do not Read binary."
  exit 0
fi

soft=$(cfg_int largeFileLineThreshold 250)
hard=$(cfg_int hardDenyLineThreshold 600)
default_limit=$(cfg_int defaultReadLimit 150)
max_limit=$(cfg_int maxReadLimitPerCall 200)
lines=$(line_count "$path")

# Cap an explicit limit that is still too large.
if [[ -n "$limit" && "$limit" != "null" && "$limit" =~ ^[0-9]+$ ]]; then
  if (( limit > max_limit )); then
    updated=$(echo "$input" | jq --argjson cap "$max_limit" '.tool_input + { "limit": $cap }')
    jq -n --argjson u "$updated" '{permission:"allow",updated_input:$u}'
    exit 0
  fi
  allow_pre
  exit 0
fi

(( lines <= soft )) && { allow_pre; exit 0; }

if (( lines > hard )); then
  jq -n \
    --arg path "$path" --argjson lines "$lines" --argjson lim "$default_limit" \
    '{permission:"deny",agent_message:("File \($path) has \($lines) lines. Use Grep or Read offset=1 limit=\($lim).")}'
  exit 0
fi

jq -n \
  --arg path "$path" --argjson lim "$default_limit" --arg off "${offset:-1}" \
  '{
    permission: "allow",
    updated_input: {
      path: $path,
      offset: (if ($off | length) > 0 and $off != "null" then ($off | tonumber) else 1 end),
      limit: $lim
    }
  }'
