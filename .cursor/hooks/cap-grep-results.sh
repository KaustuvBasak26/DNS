#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"

input=$(cat)
head_limit=$(echo "$input" | jq -r '.tool_input.head_limit // empty')
pattern=$(echo "$input" | jq -r '.tool_input.pattern // empty')

[[ -z "$pattern" ]] && { allow_pre; exit 0; }

default_cap=$(cfg_int grepDefaultHeadLimit 40)
max_cap=$(cfg_int grepMaxHeadLimit 80)
new_limit=$default_cap
needs_cap=false

if [[ -z "$head_limit" || "$head_limit" == "null" ]]; then
  needs_cap=true
elif [[ "$head_limit" =~ ^[0-9]+$ ]] && (( head_limit > max_cap )); then
  needs_cap=true
  new_limit=$max_cap
fi

[[ "$needs_cap" != true ]] && { allow_pre; exit 0; }

updated=$(echo "$input" | jq --argjson cap "$new_limit" '.tool_input + { "head_limit": $cap }')
jq -n --argjson u "$updated" '{permission:"allow",updated_input:$u}'
