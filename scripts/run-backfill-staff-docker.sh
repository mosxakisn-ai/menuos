#!/usr/bin/env bash
# Run staff assignment backfill on server (no local npm required).
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
cd "$ROOT"

NETWORK="$(docker compose -f docker-compose.prod.yml ps -q menuos-web 2>/dev/null | xargs -r docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null | head -1)"
NETWORK="${NETWORK:-menuos_default}"

echo "==> Staff assignment backfill (docker, network=$NETWORK)"
docker run --rm \
  --network "$NETWORK" \
  -v "$ROOT:/app" \
  -v "$ROOT/.env:/app/.env:ro" \
  -w /app \
  node:20-alpine \
  sh -c 'npm run db:generate -s && npx tsx scripts/backfill-staff-assignments.ts'
