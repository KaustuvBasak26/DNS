#!/usr/bin/env bash
# Runs before every user prompt hits the LLM (Pass 2: block binary attachments).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

input=$(cat)
max_chars=$(cfg_int maxPromptChars 8000)
max_attach=$(cfg_int maxAttachments 4)
max_attach_lines=$(cfg_int maxAttachmentLines 600)
block_binary=$(cfg blockBinaryFileReads true)

prompt=$(echo "$input" | jq -r '.prompt // empty')
cid=$(conv_id_from "$input")

count_file="$(state_dir)/${cid}.prompt.count"
count=0
[[ -f "$count_file" ]] && count=$(cat "$count_file")
count=$((count + 1))
echo "$count" | atomic_write "$count_file"

if [[ -n "$prompt" ]] && (( ${#prompt} > max_chars )); then
  continue_block "Prompt is ${#prompt} chars (max ${max_chars}). Shorten or split."
  exit 0
fi

attach_count=$(echo "$input" | jq '[.attachments[]? | select(.type == "file")] | length')
if (( attach_count > max_attach )); then
  continue_block "${attach_count} file attachments (max ${max_attach}). Remove extras."
  exit 0
fi

while IFS= read -r fpath; do
  [[ -z "$fpath" || ! -f "$fpath" ]] && continue
  if [[ "$block_binary" == "true" ]] && is_binary_file "$fpath"; then
    continue_block "Attached file ${fpath} looks binary. Reference by path; do not attach."
    exit 0
  fi
  lines=$(line_count "$fpath")
  if (( lines > max_attach_lines )); then
    continue_block "Attached ${fpath} has ${lines} lines (max ${max_attach_lines}). Reference by path instead."
    exit 0
  fi
done < <(echo "$input" | jq -r '.attachments[]? | select(.type == "file") | .file_path')

continue_ok
