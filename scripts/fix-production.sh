#!/usr/bin/env bash
# Run on Hetzner as root when GitHub Actions deploy fails:
#   cd /opt/menuos && git pull origin main && bash scripts/fix-production.sh
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
cd "$ROOT"

bash "$ROOT/scripts/ensure-env.sh"

# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT"
apply_production_env_defaults "$ROOT/.env"
load_env "$ROOT"

PG_USER="${POSTGRES_USER:-menuos}"
PG_DB="${POSTGRES_DB:-menuos}"

echo "==> Env check"
missing=0
for key in NEXTAUTH_SECRET APP_URL NEXTAUTH_URL DATABASE_URL; do
  if [ -z "${!key:-}" ]; then
    echo "  MISSING: $key"
    missing=1
  fi
done
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "  WARN: POSTGRES_PASSWORD is empty — OK only if Postgres volume was created without password."
else
  echo "  OK: POSTGRES_PASSWORD is set"
fi
if [ -z "${MAILBOX_PASSWORD:-}" ]; then
  echo "  WARN: MAILBOX_PASSWORD empty — registration OTP emails will not send."
else
  echo "  OK: MAILBOX_PASSWORD is set"
fi
if [ "$missing" -eq 1 ]; then
  echo "Fix .env and re-run."
  exit 1
fi

echo ""
echo "==> Postgres probe"
docker compose -f docker-compose.prod.yml up -d postgres
for i in $(seq 1 20); do
  if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" -c "SELECT 1" >/dev/null 2>&1; then
  echo "  Postgres: OK"
else
  echo "  Postgres: FAIL — password in .env does not match the database volume."
  echo "  Fix POSTGRES_PASSWORD in $ROOT/.env (or reset volume if this is a fresh install)."
  echo "  Continuing anyway to rebuild the web container..."
fi

echo ""
echo "==> Postgres hostname (menuos-db avoids MatchWork network collision)"
bash "$ROOT/scripts/align-postgres-password.sh" 2>/dev/null || true

echo ""
export APP_DIR="$ROOT"
export RUN_DB_PUSH=1
export STRICT=0
bash "$ROOT/scripts/sync-all.sh" || bash "$ROOT/scripts/server-deploy.sh"

echo ""
echo "==> Health (in container)"
bash "$ROOT/scripts/health-check.sh" 2>/dev/null \
  || echo "  /api/health not ready — see: docker compose -f docker-compose.prod.yml logs menuos-web --tail 50"

echo ""
echo "Done. Test: https://menuos.gr/api/health and https://menuos.gr/register"
