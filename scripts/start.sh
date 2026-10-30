#!/usr/bin/env bash
# Idempotent start: kills anything on the port, migrates, builds if needed, serves.
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-3000}"

stop_port() {
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "${PORT}/tcp" 2>/dev/null || true
  elif command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -t -i :"$PORT" 2>/dev/null || true)"
    [ -z "$pids" ] || kill $pids 2>/dev/null || true
  fi
  sleep 0.5
}

stop_port

if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi

npm run db:push

if [ ! -f .next/BUILD_ID ] || [ "${FORCE_BUILD:-0}" = "1" ]; then
  npm run build
fi

exec npx next start -H 0.0.0.0 -p "$PORT"
