#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT/backend"
pip install -r requirements.txt

cd "$ROOT/frontend"
npm install
npm run build

rm -rf "$ROOT/backend/static"
cp -r dist "$ROOT/backend/static"
