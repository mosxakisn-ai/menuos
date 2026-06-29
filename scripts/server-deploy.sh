#!/usr/bin/env bash
set -euo pipefail

ROOT="/opt/menuos"
CADDY_FILE="/opt/matchwork/docker/Caddyfile"
MARKER="# MenuOS — menuos.gr"

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

echo "==> DB schema sync..."
docker compose -f docker-compose.prod.yml run --rm --no-deps --user root --entrypoint sh menuos-web -c \
  "npx prisma db push --schema=/app/packages/db/prisma/schema.prisma --skip-generate"

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
curl -s -o /dev/null -w "menuos local: %{http_code}\n" http://127.0.0.1:3000/ 2>/dev/null || true
