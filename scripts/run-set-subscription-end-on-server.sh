#!/usr/bin/env bash
# Set subscription period end on production (e.g. PRO until 2030-12-31).
# Usage: bash scripts/run-set-subscription-end-on-server.sh fanenos@gmail.com 2030-12-31
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source scripts/load-env.sh
load_env "$ROOT"

EMAIL="${1:-}"
END_DATE="${2:-}"
PLAN="${3:-PRO}"

if [ -z "$EMAIL" ] || [ -z "$END_DATE" ]; then
  echo "Usage: bash scripts/run-set-subscription-end-on-server.sh <email> <YYYY-MM-DD> [PLAN]"
  exit 1
fi

DB_URL="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv DATABASE_URL)"
if [ -z "$DB_URL" ]; then
  echo "ERROR: could not read DATABASE_URL"
  exit 1
fi

docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -e SET_PERIOD_EMAIL="$EMAIL" \
  -e SET_PERIOD_END="$END_DATE" \
  -e SET_PERIOD_PLAN="$PLAN" \
  -v "$ROOT/scripts/set-subscription-period-end.mjs:/grant.mjs:ro" \
  -v "$ROOT/packages/db/prisma:/prisma:ro" \
  -w /tmp \
  node:20-alpine sh -c '
    echo "{\"type\":\"module\"}" > package.json
    cp /grant.mjs grant.mjs
    cp -r /prisma ./prisma
    npm install @prisma/client@6.19.3 prisma@6.19.3 --silent
    npx prisma generate --schema=./prisma/schema.prisma
    node grant.mjs
  '
