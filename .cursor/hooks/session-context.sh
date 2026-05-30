#!/usr/bin/env bash
# Inject compact repo map + cache config in session env (Pass 1/4).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
root=$(echo "$input" | jq -r '.workspace_roots[]? // empty' | head -1)
root="${root:-.}"
max_files=$(cfg_int maxSessionRepoFiles 25)

map_files() {
  [[ -d "$root" ]] || return 0
  find "$root" -maxdepth 4 \
    \( -path '*/.git/*' -o -path '*/node_modules/*' -o -path '*/dist/*' \
       -o -path '*/build/*' -o -path '*/__pycache__/*' -o -path '*/.cursor/*' \) -prune \
    -o -type f \( -name '*.py' -o -name '*.go' -o -name '*.rs' -o -name '*.js' -o -name '*.ts' \
       -o -name '*.c' -o -name '*.cpp' -o -name '*.h' -o -name '*.java' -o -name '*.md' \
       -o -name '*.json' -o -name '*.sh' \) -print 2>/dev/null \
    | sed "s|^$root/||" | head -"$max_files"
}

files=$(map_files)
if [[ -n "$files" ]]; then
  file_block=$'\nSource files ('"$max_files"' max):\n'"$files"
else
  file_block=$'\nNo source files yet — scaffold only.'
fi

read_limit=$(cfg_int defaultReadLimit 150)
context="Token budget ON. Grep/Glob first; Read offset+limit (≤${read_limit} lines); max 2 explore subagents. No docs unless asked. Concise replies only."$file_block

config_json=$(jq -c . "$TOKEN_BUDGET_CONFIG_FILE")
jq -n \
  --arg ctx "$context" \
  --arg cfg "$config_json" \
  --arg sdir "$(state_dir)" \
  '{
    "additional_context": $ctx,
    "env": {
      "TOKEN_BUDGET_CONFIG": $cfg,
      "TOKEN_BUDGET_STATE_DIR": $sdir
    }
  }'
