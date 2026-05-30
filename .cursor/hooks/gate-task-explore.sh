#!/usr/bin/env bash
# Gate narrow Task subagents — explore + generalPurpose (Pass 2/5).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
description=$(echo "$input" | jq -r '.tool_input.description // .tool_input.prompt // empty')
subagent_type=$(echo "$input" | jq -r '.tool_input.subagent_type // empty')

[[ "$subagent_type" != "explore" && "$subagent_type" != "generalPurpose" ]] && { allow_pre; exit 0; }

if echo "$description" | grep -Eiq 'very thorough|comprehensive|audit entire|full codebase|multi-?area'; then
  allow_pre
  exit 0
fi

# Needle queries: short or match lookup patterns.
is_narrow=false
(( ${#description} <= 120 )) && is_narrow=true
echo "$description" | grep -Eiq '^(where|find|locate|which file|what file|show me).*(defined|located|handle)' && is_narrow=true

if [[ "$is_narrow" == true ]]; then
  jq -n --arg task "$description" --arg st "$subagent_type" \
    '{permission:"deny",agent_message:("Skip \($st) subagent for \"\($task)\". Use Grep/Glob/Read directly.")}'
  exit 0
fi

allow_pre
