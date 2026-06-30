#!/usr/bin/env bash
set -euo pipefail
ROOT="${APP_DIR:-/opt/menuos}"
CADDY_FILE="/opt/matchwork/docker/Caddyfile"
MARKER="# Append to /opt/matchwork/docker/Caddyfile — MenuOS (menuos.gr)"
RUN_DB_PUSH="${RUN_DB_PUSH:-1}"

cd "$ROOT"

if [ ! -f .env ]; then
  echo "ERROR: missing $ROOT/.env"
  exit 1
fi

echo "==> Start Postgres..."
docker compose -f docker-compose.prod.yml up -d postgres
sleep 5

echo "==> Build MenuOS web..."
docker compose -f docker-compose.prod.yml build menuos-web

if [ "$RUN_DB_PUSH" = "1" ]; then
  echo "==> DB schema sync..."
  docker compose -f docker-compose.prod.yml run --rm --no-deps --user root --entrypoint sh menuos-web -c \
    "npx prisma db push --schema=/app/packages/db/prisma/schema.prisma --skip-generate"
else
  echo "==> Skipping DB schema sync (RUN_DB_PUSH=0)"
fi

echo "==> Start MenuOS web..."
docker compose -f docker-compose.prod.yml up -d menuos-web

if ! grep -q "$MARKER" "$CADDY_FILE" 2>/dev/null; then
  echo "==> Adding MenuOS to Caddy..."
  cat docker/Caddyfile.snippet >> "$CADDY_FILE"
fi

echo "==> Reload Caddy (MatchWork container)..."
docker exec matchwork-caddy-1 caddy reload --config /etc/caddy/Caddyfile

echo "==> Done."
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec -T menuos-web wget -q -O /dev/null -S http://127.0.0.1:3000/ 2>&1 | head -1 || true
