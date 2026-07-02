#!/usr/bin/env bash
set -euo pipefail
cd /opt/menuos

DB_URL="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv DATABASE_URL)"
if [ -z "$DB_URL" ]; then
  echo "ERROR: could not read DATABASE_URL from menuos-web"
  exit 1
fi

docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -e DRY_RUN="${DRY_RUN:-}" \
  -v /opt/menuos/scripts:/scripts:ro \
  -v /opt/menuos/packages/db/prisma:/prisma:ro \
  -w /scripts \
  node:20-alpine sh -c '
    cp -r /prisma ./prisma
    npm install @prisma/client@6.19.3 prisma@6.19.3
    npx prisma generate --schema=./prisma/schema.prisma
    node backfill-onboarding-venues.mjs
  '
