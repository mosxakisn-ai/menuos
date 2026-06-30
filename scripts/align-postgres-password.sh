#!/usr/bin/env bash
# Align Postgres password with .env and restart web (run on server as root).
set -euo pipefail
ROOT="${APP_DIR:-/opt/menuos}"
cd "$ROOT"

# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT"

POSTGRES_USER="${POSTGRES_USER:-menuos}"
POSTGRES_DB="${POSTGRES_DB:-menuos}"
DATABASE_HOST="${DATABASE_HOST:-menuos-db}"
DATABASE_PORT="${DATABASE_PORT:-5432}"

if [ -z "${POSTGRES_PASSWORD:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  POSTGRES_PASSWORD="$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')"
fi

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"
  echo "Generated new POSTGRES_PASSWORD"
fi

echo "POSTGRES_PASSWORD length: ${#POSTGRES_PASSWORD}"

URL="$(build_database_url)"
export POSTGRES_PASSWORD POSTGRES_USER POSTGRES_DB DATABASE_HOST DATABASE_PORT

if grep -q '^POSTGRES_PASSWORD=' .env; then
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
else
  echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env
fi

for pair in \
  "POSTGRES_USER=$POSTGRES_USER" \
  "POSTGRES_DB=$POSTGRES_DB" \
  "DATABASE_HOST=$DATABASE_HOST" \
  "DATABASE_PORT=$DATABASE_PORT" \
  "DATABASE_URL=$URL"; do
  key="${pair%%=*}"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${pair}|" .env
  else
    echo "$pair" >> .env
  fi
done

if ! docker compose -f docker-compose.prod.yml exec -T postgres \
  psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}" -c "SELECT 1" >/dev/null 2>&1; then
  echo "Resetting Postgres password to match .env..."
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER USER ${POSTGRES_USER} WITH PASSWORD '$POSTGRES_PASSWORD';"
fi

echo "Postgres password aligned."
docker compose -f docker-compose.prod.yml up -d --force-recreate menuos-web
sleep 5
bash "$ROOT/scripts/health-check.sh" || true
