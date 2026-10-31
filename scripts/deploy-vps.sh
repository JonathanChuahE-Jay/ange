#!/usr/bin/env bash
# Redeploy ange to the VPS (devilynnnnnn.wtf). Run from the project root.
#   bash scripts/deploy-vps.sh            → code only, keeps the live database
#   bash scripts/deploy-vps.sh --with-db  → ALSO replaces the live DB with seed/ange.db
#
# Server layout (set up once):
#   /srv/ange/app            app (owned by user `ange`)
#   /var/lib/ange/ange.db    live SQLite DB (photos/videos/music inside)
#   /etc/ange.env            ADMIN_PASSWORD, AUTH_SECRET, DATABASE_URL…
#   ange.service             systemd, next start on 127.0.0.1:3005
#   nginx site devilynnnnnn.wtf (Cloudflare origin cert in /etc/ssl/cloudflare)
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${ANGE_HOST:-ange-vps}"   # ~/.ssh/config alias (key auth)

npm run build
[ "${1:-}" = "--with-db" ] && npm run db:snapshot

tar --exclude=./node_modules --exclude=./.git --exclude=./.next/cache --exclude=./.next/dev \
    --exclude=./data --exclude=./.npm-cache --exclude='./.env*' --exclude=./.unipi \
    --exclude='*.tsbuildinfo' -czf /tmp/ange.tgz .
scp /tmp/ange.tgz "$HOST":/root/ange.tgz

ssh "$HOST" WITH_DB="${1:-}" bash -s <<'REMOTE'
set -euo pipefail
export PATH=/usr/local/lib/node22/bin:$PATH
cd /srv/ange/app
OLD_LOCK=$(sha1sum package-lock.json 2>/dev/null | cut -c1-40 || true)
find . -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
tar -xzf /root/ange.tgz && rm /root/ange.tgz
# the box has 1 GB RAM: a full install gets OOM-killed → prod deps only, and only when the lockfile changed
if [ "$OLD_LOCK" != "$(sha1sum package-lock.json | cut -c1-40)" ] || [ ! -e node_modules/next ]; then
  echo "dependencies changed → npm ci --omit=dev"
  rm -rf node_modules && npm ci --omit=dev --no-audit --no-fund >/dev/null
fi
set -a; . /etc/ange.env; set +a
if [ "$WITH_DB" = "--with-db" ]; then
  systemctl stop ange
  cp /var/lib/ange/ange.db "/var/lib/ange/ange.db.bak-$(date +%F-%H%M)"
  rm -f /var/lib/ange/ange.db /var/lib/ange/ange.db-wal /var/lib/ange/ange.db-shm
  node scripts/db-snapshot.mjs restore
fi
# schema: the app's own startup migrations (src/lib/db.ts) handle column changes;
# drizzle-kit is a dev dep and isn't installed here
chown -R ange:ange /srv/ange /var/lib/ange
systemctl restart ange
sleep 4
curl -s -o /dev/null -w "local %{http_code}\n" http://127.0.0.1:3005/api/version
REMOTE
echo "deployed → https://devilynnnnnn.wtf"
