#!/usr/bin/env bash
set -euo pipefail
ROOT="${APP_DIR:-/opt/menuos}"
CADDY_FILE="/opt/matchwork/docker/Caddyfile"
MARKER="# Append to /opt/matchwork/docker/Caddyfile — MenuOS (menuos.gr)"

cd "$ROOT"

mkdir -p "$ROOT/data/uploads"
chown -R 1001:1001 "$ROOT/data/uploads" 2>/dev/null || true

if [ ! -f .env ]; then
  echo "ERROR: missing $ROOT/.env"
  exit 1
fi

# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT"

# shellcheck source=scripts/lib/caddy-reload.sh
source "$ROOT/scripts/lib/caddy-reload.sh"

PG_USER="${POSTGRES_USER:-menuos}"
PG_DB="${POSTGRES_DB:-menuos}"
RUN_DB_PUSH="${RUN_DB_PUSH:-1}"

echo "==> Start Postgres..."
docker compose -f docker-compose.prod.yml up -d postgres
echo "    Waiting for Postgres..."
for i in $(seq 1 30); do
  if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
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
  psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" >/dev/null 2>&1; then
  echo "WARN: Cannot query Postgres. Check POSTGRES_PASSWORD in .env matches the database volume."
  echo "      Continuing deploy — web will start but API calls need a working database."
fi

echo "==> Build MenuOS web..."
docker compose -f docker-compose.prod.yml build menuos-web

if [ "$RUN_DB_PUSH" = "1" ]; then
  echo "==> DB schema sync..."
  if [ -z "${DATABASE_URL:-}" ]; then
    DATABASE_URL="$(build_database_url)"
    export DATABASE_URL
  fi
  PRISMA_NETWORK="$(docker compose -f docker-compose.prod.yml ps -q postgres 2>/dev/null | head -1 | xargs -r docker inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' 2>/dev/null || true)"
  PRISMA_NETWORK="${PRISMA_NETWORK:-menuos_default}"
  if docker run --rm \
    --network "$PRISMA_NETWORK" \
    -e DATABASE_URL="$DATABASE_URL" \
    -v "$ROOT/packages/db/prisma:/prisma:ro" \
    node:20-alpine sh -c \
    'npm install -g prisma@6.19.3 --silent && prisma db push --schema=/prisma/schema.prisma --skip-generate --accept-data-loss'; then
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
if HEALTH="$(bash "$ROOT/scripts/health-check.sh" 2>/dev/null)"; then
  echo "$HEALTH"
  if ! echo "$HEALTH" | grep -q '"database":"ok"'; then
    echo "WARN: Web is up but database check failed — verify POSTGRES_PASSWORD / DATABASE_URL in .env"
  fi
else
  echo "WARN: /api/health not reachable yet — check logs:"
  docker compose -f docker-compose.prod.yml logs menuos-web --tail 20 || true
fi

CADDY_STATE="$ROOT/data/.menuos-caddy-active"
ensure_menuos_caddy_routing "$ROOT" "$CADDY_FILE" "$MARKER" "$CADDY_STATE"

echo "==> Done."
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml exec -T menuos-web node -e \
  "fetch('http://127.0.0.1:3000/').then(r=>console.log('home',r.status)).catch(()=>process.exit(1))" 2>/dev/null || true

if [ "${RUN_INDEXNOW:-0}" = "1" ] && [ -f "$ROOT/scripts/submit-indexnow.mjs" ]; then
  echo "==> IndexNow ping..."
  docker run --rm \
    -v "$ROOT/scripts/submit-indexnow.mjs:/script.mjs:ro" \
    -v "$ROOT/.env:/app/.env:ro" \
    -e RUN_INDEXNOW=1 \
    -w /app \
    node:20-alpine node /script.mjs \
    || echo "    IndexNow failed (non-fatal)"
fi
