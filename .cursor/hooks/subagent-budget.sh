#!/usr/bin/env bash
# Limit explore + generalPurpose subagents (Pass 5).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
subagent_type=$(echo "$input" | jq -r '.subagent_type // empty')
cid=$(conv_id_from "$input")

case "$subagent_type" in
  explore)
    counter_file="$(state_dir)/${cid}.explore.count"
    max=$(cfg_int maxExploreSubagentsPerSession 2)
    ;;
  generalPurpose)
    counter_file="$(state_dir)/${cid}.general.count"
    max=$(cfg_int maxGeneralSubagentsPerSession 3)
    ;;
  *)
    allow_pre
    exit 0
    ;;
esac

count=0
[[ -f "$counter_file" ]] && count=$(cat "$counter_file")
count=$((count + 1))
echo "$count" | atomic_write "$counter_file"

if (( count > max )); then
  jq -n --arg st "$subagent_type" --argjson n "$count" --argjson m "$max" \
    '{permission:"deny",user_message:("\($st) subagent \($n)/\($m) this session. Use direct tools.")}'
  exit 0
fi

allow_pre
