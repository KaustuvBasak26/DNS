#!/usr/bin/env bash
# Block token-heavy shell commands (Pass 4: git log/diff, less/more).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')
[[ -z "$command" ]] && { allow_pre; exit 0; }

soft=$(cfg_int largeFileLineThreshold 250)

if [[ "$command" =~ (^|[[:space:]])(cat|type|bat)[[:space:]]+([^|;&]+) ]]; then
  target="${BASH_REMATCH[3]%% *}"
  target="${target//\"/}"; target="${target//\'/}"
  if [[ -f "$target" ]]; then
    lines=$(line_count "$target")
    if (( lines > soft )); then
      deny_pre "Shell blocked: ${command}. ${target} has ${lines} lines — use Grep or Read offset+limit."
      exit 0
    fi
  fi
fi

if [[ "$command" =~ (^|[[:space:]])find[[:space:]] ]] && [[ ! "$command" =~ -maxdepth ]]; then
  deny_pre "Shell blocked: ${command}. Add -maxdepth to limit output."
  exit 0
fi

if [[ "$command" =~ (^|[[:space:]])(grep[[:space:]]+-r|rg[[:space:]]+) ]] \
  && [[ ! "$command" =~ (-m[[:space:]]+[0-9]|--max-count|--head-limit|head[[:space:]]+-) ]]; then
  deny_pre "Shell blocked: ${command}. Add -m/--max-count or pipe to head."
  exit 0
fi

if [[ "$command" =~ (^|[[:space:]])(git[[:space:]]+(log|diff|show)) ]] \
  && [[ ! "$command" =~ (-n[[:space:]]+[0-9]|--max-count|head[[:space:]]+-) ]]; then
  deny_pre "Shell blocked: ${command}. Cap git output: git log -n 20, git diff -- path."
  exit 0
fi

if [[ "$command" =~ (^|[[:space:]])(less|more|vim|nano|emacs)[[:space:]] ]]; then
  deny_pre "Shell blocked: ${command}. Interactive pagers waste tokens — use Read/Grep."
  exit 0
fi

allow_pre
