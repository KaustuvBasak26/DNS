#!/usr/bin/env bash
# Cap SemanticSearch result count (Pass 3).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
query=$(echo "$input" | jq -r '.tool_input.query // empty')
num=$(echo "$input" | jq -r '.tool_input.num_results // empty')

[[ -z "$query" ]] && { allow_pre; exit 0; }

default_cap=$(cfg_int semanticDefaultResults 15)
max_cap=$(cfg_int semanticMaxResults 25)
new_limit=$default_cap
needs_cap=false

if [[ -z "$num" || "$num" == "null" ]]; then
  needs_cap=true
elif [[ "$num" =~ ^[0-9]+$ ]] && (( num > max_cap )); then
  needs_cap=true
  new_limit=$max_cap
fi

[[ "$needs_cap" != true ]] && { allow_pre; exit 0; }

updated=$(echo "$input" | jq --argjson cap "$new_limit" '.tool_input + { "num_results": $cap }')
jq -n --argjson u "$updated" '{permission:"allow",updated_input:$u}'
