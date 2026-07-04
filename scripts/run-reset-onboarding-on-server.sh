#!/usr/bin/env bash
set -euo pipefail
EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then
  echo "Usage: bash scripts/run-reset-onboarding-on-server.sh <email>"
  exit 1
fi
cd /opt/menuos
DB_URL="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv DATABASE_URL)"
docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -v /opt/menuos/scripts/reset-onboarding-test-user.mjs:/reset.mjs:ro \
  -v /opt/menuos/packages/db/prisma:/prisma:ro \
  -v /opt/menuos/node_modules/@prisma/client:/node_modules/@prisma/client:ro \
  -v /opt/menuos/node_modules/.prisma:/node_modules/.prisma:ro \
  -w /tmp node:20-alpine sh -c '
    cp /reset.mjs reset.mjs
    NODE_PATH=/node_modules node reset.mjs '"$EMAIL"'
  '
