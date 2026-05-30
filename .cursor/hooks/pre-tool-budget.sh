#!/usr/bin/env bash
# Universal pre-tool gate (Pass 3: SemanticSearch + WebSearch).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
hooks_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$tool_name" in
  Read)            echo "$input" | "$hooks_dir/limit-large-reads.sh" ;;
  Grep)            echo "$input" | "$hooks_dir/cap-grep-results.sh" ;;
  Glob)            echo "$input" | "$hooks_dir/cap-glob-results.sh" ;;
  Task)            echo "$input" | "$hooks_dir/gate-task-explore.sh" ;;
  Shell)           echo "$input" | "$hooks_dir/guard-shell-tool.sh" ;;
  SemanticSearch)  echo "$input" | "$hooks_dir/cap-semantic-search.sh" ;;
  WebSearch|WebFetch) echo "$input" | "$hooks_dir/guard-web-tools.sh" ;;
  *)               allow_pre ;;
esac
