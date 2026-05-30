#!/usr/bin/env bash
# Limit web tool usage that pulls large external context (Pass 3).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
cid=$(conv_id_from "$input")
counter_file="$(state_dir)/${cid}.web.count"

count=0
[[ -f "$counter_file" ]] && count=$(cat "$counter_file")
count=$((count + 1))
echo "$count" | atomic_write "$counter_file"

max_web=$(cfg_int maxWebToolsPerSession 5)
if (( count > max_web )); then
  deny_pre "Web tool limit (${max_web}/session). Reuse prior search/fetch results."
  exit 0
fi

allow_pre
