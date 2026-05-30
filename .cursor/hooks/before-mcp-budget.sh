#!/usr/bin/env bash
# Gate MCP tools that return large payloads (Pass 5).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // .mcp_tool // .tool // empty')

if echo "$tool_name" | grep -Eiq 'figma|image|screenshot|video|fetch.*resource'; then
  jq -n \
    --arg t "$tool_name" \
    '{
      permission: "ask",
      user_message: ("MCP tool \($t) may return large media. Approve only if needed."),
      agent_message: ("Prefer text/code tools over \($t) to save tokens.")
    }'
  exit 0
fi

allow_pre
