#!/usr/bin/env bash
# Unified duplicate tool tracker for Read + Grep (Pass 3/4).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
cid=$(conv_id_from "$input")
warn_min=$(cfg_int rereadWarnMinutes 10)
now=$(date +%s)

case "$tool_name" in
  Read)
    path=$(echo "$input" | jq -r '.tool_input.path // .tool_input.target_file // empty')
    offset=$(echo "$input" | jq -r '.tool_input.offset // 1')
    limit=$(echo "$input" | jq -r '.tool_input.limit // all')
    key="read|${path}|${offset}|${limit}"
    ;;
  Grep)
    pattern=$(echo "$input" | jq -r '.tool_input.pattern // empty')
    path=$(echo "$input" | jq -r '.tool_input.path // .')
    key="grep|${pattern}|${path}"
    ;;
  *)
    exit 0
    ;;
esac

[[ -z "$key" || "$key" == *"||"* ]] && exit 0

state_file="$(state_dir)/${cid}.tools.log"
if [[ -f "$state_file" ]] && grep -Fq "${key}|" "$state_file" 2>/dev/null; then
  prior=$(grep -F "${key}|" "$state_file" | tail -1 | cut -d'|' -f5)
  if [[ -n "$prior" && "$prior" =~ ^[0-9]+$ ]]; then
    elapsed=$(( (now - prior) / 60 ))
    if (( elapsed < warn_min )); then
      jq -n --arg k "$key" --argjson m "$elapsed" \
        '{additional_context:("Duplicate \($k) ~\($m)m ago. Reuse prior result.")}'
      exit 0
    fi
  fi
fi

echo "${key}|${now}" >> "$state_file"
exit 0
