#!/usr/bin/env bash
# Align Postgres password with .env and restart web (run on server as root).
set -euo pipefail
ROOT="${APP_DIR:-/opt/menuos}"
cd "$ROOT"
sed -i 's/\r$//' .env

set -a
# shellcheck disable=SC1091
source .env
set +a

# Ensure POSTGRES_PASSWORD matches DATABASE_URL if only one is set
if [ -z "${POSTGRES_PASSWORD:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  POSTGRES_PASSWORD="$(echo "$DATABASE_URL" | sed -n 's|.*://menuos:\([^@]*\)@.*|\1|p')"
  export POSTGRES_PASSWORD
fi

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  POSTGRES_PASSWORD="$(openssl rand -hex 16)"
  export POSTGRES_PASSWORD
  echo "Generated new POSTGRES_PASSWORD"
fi

echo "POSTGRES_PASSWORD length: ${#POSTGRES_PASSWORD}"

# Update .env consistently (LF only)
if grep -q '^POSTGRES_PASSWORD=' .env; then
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$POSTGRES_PASSWORD|" .env
else
  echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env
fi

URL="postgresql://menuos:${POSTGRES_PASSWORD}@menuos-db:5432/menuos"
if grep -q '^DATABASE_URL=' .env; then
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$URL|" .env
else
  echo "DATABASE_URL=$URL" >> .env
fi

# Test TCP auth; if fail, reset password inside Postgres (local trust via socket)
if ! docker compose -f docker-compose.prod.yml exec -T postgres \
  psql "postgresql://menuos:${POSTGRES_PASSWORD}@127.0.0.1:5432/menuos" -c "SELECT 1" >/dev/null 2>&1; then
  echo "Resetting menuos DB password to match .env..."
  docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U menuos -d menuos -v pw="$POSTGRES_PASSWORD" \
    -c "ALTER USER menuos WITH PASSWORD :'pw';" 2>/dev/null \
    || docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U menuos -d menuos -c "ALTER USER menuos WITH PASSWORD '$POSTGRES_PASSWORD';"
fi

echo "Postgres password aligned."
docker compose -f docker-compose.prod.yml up -d --force-recreate menuos-web
sleep 5
bash "$ROOT/scripts/health-check.sh" || true
