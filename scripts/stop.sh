#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-3000}"
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -t -i :"$PORT" 2>/dev/null || true)"
  [ -z "$pids" ] || kill $pids 2>/dev/null || true
fi
echo "stopped :$PORT"
