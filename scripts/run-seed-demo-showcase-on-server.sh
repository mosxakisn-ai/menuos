#!/usr/bin/env bash
# Fill demo-taverna (and optionally all org venues) with showcase data.
# Pauses demo call cleanup for 14 days via DEMO_SHOWCASE_UNTIL in .env.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source scripts/load-env.sh
load_env "$ROOT"

DB_URL="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv DATABASE_URL)"
if [ -z "$DB_URL" ]; then
  echo "ERROR: could not read DATABASE_URL from menuos-web"
  exit 1
fi

SHOWCASE_UNTIL="${DEMO_SHOWCASE_UNTIL:-}"
if [ -z "$SHOWCASE_UNTIL" ]; then
  SHOWCASE_UNTIL="$(date -u -d '+14 days' '+%Y-%m-%dT23:59:59.000Z' 2>/dev/null || date -u -v+14d '+%Y-%m-%dT23:59:59.000Z')"
fi

if grep -q '^DEMO_SHOWCASE_UNTIL=' .env 2>/dev/null; then
  sed -i "s|^DEMO_SHOWCASE_UNTIL=.*|DEMO_SHOWCASE_UNTIL=${SHOWCASE_UNTIL}|" .env
else
  echo "DEMO_SHOWCASE_UNTIL=${SHOWCASE_UNTIL}" >> .env
fi
echo "DEMO_SHOWCASE_UNTIL=${SHOWCASE_UNTIL}"

docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -e SEED_REFRESH=1 \
  -e SEED_ALL_VENUES="${SEED_ALL_VENUES:-1}" \
  -e SEED_VENUE_SLUG="${SEED_VENUE_SLUG:-demo-taverna}" \
  -v /opt/menuos/scripts/seed-demo-showcase.mjs:/seed.mjs:ro \
  -v /opt/menuos/packages/db/prisma:/prisma:ro \
  -w /tmp \
  node:20-alpine sh -c '
    echo "{\"type\":\"module\"}" > package.json
    cp /seed.mjs seed.mjs
    cp -r /prisma ./prisma
    npm install @prisma/client@6.19.3 prisma@6.19.3 --silent
    npx prisma generate --schema=./prisma/schema.prisma
    node seed.mjs
  '

docker compose -f docker-compose.prod.yml up -d menuos-web
echo "Showcase seed done. Restarted web to pick up DEMO_SHOWCASE_UNTIL."

echo "==> Backfill demo menu photos..."
docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -v /opt/menuos/scripts/backfill-demo-photos.mjs:/backfill.mjs:ro \
  -v /opt/menuos/scripts/lib/demo-photos.mjs:/lib/demo-photos.mjs:ro \
  -v /opt/menuos/packages/db/prisma:/prisma:ro \
  -w /tmp \
  node:20-alpine sh -c '
    mkdir -p lib
    cp /backfill.mjs backfill.mjs
    cp /lib/demo-photos.mjs lib/demo-photos.mjs
    cp -r /prisma ./prisma
    npm install @prisma/client@6.19.3 prisma@6.19.3 --silent
    npx prisma generate --schema=./prisma/schema.prisma
    node backfill.mjs
  '
echo "Demo showcase complete (data + photos)."
