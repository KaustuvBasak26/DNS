#!/usr/bin/env bash
# Shared helpers for token-budget hooks.
set -euo pipefail

_hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export TOKEN_BUDGET_CONFIG_FILE="${TOKEN_BUDGET_CONFIG_FILE:-$_hook_dir/../token-budget.json}"

cfg() {
  local key="$1" default="$2"
  if [[ -n "${TOKEN_BUDGET_CONFIG:-}" ]]; then
    echo "$TOKEN_BUDGET_CONFIG" | jq -r --arg k "$key" --arg d "$default" '.[$k] // $d'
  else
    jq -r --arg k "$key" --arg d "$default" '.[$k] // $d' "$TOKEN_BUDGET_CONFIG_FILE"
  fi
}

cfg_int() {
  local v
  v=$(cfg "$1" "$2")
  if [[ "$v" =~ ^[0-9]+$ ]]; then echo "$v"; else echo "$2"; fi
}

state_dir() {
  mkdir -p "${TOKEN_BUDGET_STATE_DIR:-${TMPDIR:-/tmp}/cursor-token-track}"
  echo "${TOKEN_BUDGET_STATE_DIR:-${TMPDIR:-/tmp}/cursor-token-track}"
}

conv_id_from() {
  echo "$1" | jq -r '.conversation_id // .parent_conversation_id // "default"' | tr -cd '[:alnum:]._-' | head -c 64
}

allow_pre()  { echo '{"permission":"allow"}'; }
deny_pre()   { jq -n --arg m "$1" '{permission:"deny",agent_message:$m}'; }
continue_ok() { echo '{"continue":true}'; }
continue_block() { jq -n --arg m "$1" '{continue:false,user_message:$m}'; }

atomic_write() {
  local dest="$1" tmp
  tmp="${dest}.$$"
  cat > "$tmp"
  mv "$tmp" "$dest"
}

line_count() {
  local target="$1"
  if [[ -f "$target" ]]; then
    wc -l < "$target" | tr -d ' '
  else
    echo 0
  fi
}

is_binary_file() {
  local target="$1"
  [[ -f "$target" ]] && head -c 8192 "$target" 2>/dev/null | grep -q $'\0'
}
