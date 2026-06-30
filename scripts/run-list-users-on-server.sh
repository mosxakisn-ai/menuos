#!/usr/bin/env bash
set -euo pipefail
cd /opt/menuos
QUERY="${1:-}"
DB_URL="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv DATABASE_URL)"
docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -v /opt/menuos/scripts/list-users.mjs:/list.mjs:ro \
  -v /opt/menuos/packages/db/prisma:/prisma:ro \
  -w /tmp \
  node:20-alpine sh -c '
    echo "{\"type\":\"module\"}" > package.json
    cp /list.mjs list.mjs
    cp -r /prisma ./prisma
    npm install @prisma/client@6.19.3 prisma@6.19.3 --silent
    npx prisma generate --schema=./prisma/schema.prisma >/dev/null
    node list.mjs '"$QUERY"'
  '
