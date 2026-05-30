#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"
input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')
[[ -z "$command" ]] && { echo '{"permission":"allow"}'; exit 0; }
adapted=$(jq -n --arg cmd "$command" '{tool_input:{command:$cmd}}')
result=$(echo "$adapted" | "$(dirname "$0")/guard-shell-tool.sh")
permission=$(echo "$result" | jq -r '.permission // "allow"')
if [[ "$permission" == "deny" ]]; then
  msg=$(echo "$result" | jq -r '.agent_message // "Shell blocked for token budget."')
  jq -n --arg m "$msg" '{permission:"deny",user_message:$m,agent_message:$m}'
  exit 0
fi
echo '{"permission":"allow"}'
