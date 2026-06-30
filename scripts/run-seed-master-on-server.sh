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
  -e SEED_MASTER_EMAIL='mosxakisn@gmail.com' \
  -e SEED_MASTER_PASSWORD='MenuOS-Master-2026!' \
  -v /opt/menuos/scripts/seed-master-user.mjs:/seed.mjs:ro \
  -v /opt/menuos/packages/db/prisma:/prisma:ro \
  -w /tmp \
  node:20-alpine sh -c '
    echo "{\"type\":\"module\"}" > package.json
    cp /seed.mjs seed.mjs
    cp -r /prisma ./prisma
    npm install bcryptjs @prisma/client@6.19.3 prisma@6.19.3
    npx prisma generate --schema=./prisma/schema.prisma
    node seed.mjs
  '
