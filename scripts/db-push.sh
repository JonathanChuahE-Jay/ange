#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p data
DATABASE_URL="${DATABASE_URL:-./data/ange.db}" npx drizzle-kit push --force
