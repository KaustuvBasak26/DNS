#!/usr/bin/env bash
# Purge stale session state files (Pass 4).
set -euo pipefail

source "$(dirname "$0")/lib/common.sh"

ttl_hours=$(cfg_int sessionStateTtlHours 24)
dir="$(state_dir)"
now=$(date +%s)
max_age=$(( ttl_hours * 3600 ))

shopt -s nullglob
for f in "$dir"/*; do
  [[ -f "$f" ]] || continue
  mtime=$(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null || echo "$now")
  if (( now - mtime > max_age )); then
    rm -f "$f"
  fi
done

exit 0
