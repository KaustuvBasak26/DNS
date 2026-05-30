#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"
input=$(cat)
usage=$(echo "$input" | jq -r '.context_usage_percent // empty')
msg="Context compacting — reuse prior tool results; Grep before Read."
[[ -n "$usage" && "$usage" != "null" ]] && msg="Context ${usage}% — compacting. Reuse reads; offset+limit only."
jq -n --arg m "$msg" '{user_message:$m}'
