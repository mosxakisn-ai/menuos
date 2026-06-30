#!/usr/bin/env bash
set -euo pipefail
cd /opt/menuos

EMAIL="${1:-}"
MONTHS="${2:-12}"
if [ -z "$EMAIL" ]; then
  echo "Usage: $0 <email> [months]"
  exit 1
fi

DB_URL="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv DATABASE_URL)"
if [ -z "$DB_URL" ]; then
  echo "ERROR: could not read DATABASE_URL"
  exit 1
fi

docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -e GRANT_PRO_EMAIL="$EMAIL" \
  -e GRANT_PRO_MONTHS="$MONTHS" \
  -v /opt/menuos/scripts/grant-pro-subscription.mjs:/grant.mjs:ro \
  -v /opt/menuos/packages/db/prisma:/prisma:ro \
  -w /tmp \
  node:20-alpine sh -c '
    echo "{\"type\":\"module\"}" > package.json
    cp /grant.mjs grant.mjs
    cp -r /prisma ./prisma
    npm install @prisma/client@6.19.3 prisma@6.19.3 --silent
    npx prisma generate --schema=./prisma/schema.prisma
    node grant.mjs
  '
