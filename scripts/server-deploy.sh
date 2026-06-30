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
echo "    Waiting for Postgres..."
for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U menuos -d menuos >/dev/null 2>&1; then
    echo "    Postgres ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Postgres did not become ready."
    exit 1
  fi
  sleep 2
done

if ! docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U menuos -d menuos -c "SELECT 1" >/dev/null 2>&1; then
  echo "WARN: Cannot query Postgres. Check POSTGRES_PASSWORD in .env matches the database volume."
  echo "      Continuing deploy — web will start but API calls need a working database."
fi

echo "==> Build MenuOS web..."
docker compose -f docker-compose.prod.yml build menuos-web

if [ "$RUN_DB_PUSH" = "1" ]; then
  echo "==> DB schema sync..."
  if docker compose -f docker-compose.prod.yml run --rm --no-deps --user root --entrypoint sh menuos-web -c \
    "node /app/node_modules/prisma/build/index.js db push --schema=/app/packages/db/prisma/schema.prisma --skip-generate" 2>/dev/null; then
    echo "    prisma db push OK"
  else
    echo "    prisma db push failed — applying SQL migrations..."
    bash "$ROOT/scripts/apply-sql-migrations.sh"
  fi
else
  echo "==> Skipping prisma db push (RUN_DB_PUSH=0)"
fi

echo "==> SQL migrations (idempotent)..."
bash "$ROOT/scripts/apply-sql-migrations.sh"

echo "==> Start MenuOS web..."
docker compose -f docker-compose.prod.yml up -d --force-recreate menuos-web

echo "==> In-container health check..."
sleep 4
if HEALTH="$(docker compose -f docker-compose.prod.yml exec -T menuos-web \
  wget -qO- http://127.0.0.1:3000/api/health 2>/dev/null)"; then
  echo "$HEALTH"
  if ! echo "$HEALTH" | grep -q '"database":"ok"'; then
    echo "WARN: Web is up but database check failed — verify POSTGRES_PASSWORD / DATABASE_URL in .env"
  fi
else
  echo "WARN: /api/health not reachable yet — check logs:"
  docker compose -f docker-compose.prod.yml logs menuos-web --tail 20 || true
fi

if ! grep -q "$MARKER" "$CADDY_FILE" 2>/dev/null; then
  echo "==> Adding MenuOS to Caddy..."
  cat docker/Caddyfile.snippet >> "$CADDY_FILE"
fi

echo "==> Reload Caddy (MatchWork container)..."
docker exec matchwork-caddy-1 caddy reload --config /etc/caddy/Caddyfile

echo "==> Done."
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec -T menuos-web wget -q -O /dev/null -S http://127.0.0.1:3000/ 2>&1 | head -1 || true

if [ "${RUN_INDEXNOW:-0}" = "1" ] && [ -f "$ROOT/scripts/submit-indexnow.mjs" ]; then
  echo "==> IndexNow ping..."
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env" 2>/dev/null || true
  set +a
  RUN_INDEXNOW=1 node "$ROOT/scripts/submit-indexnow.mjs" || echo "    IndexNow failed (non-fatal)"
fi
