#!/usr/bin/env bash
# Run on Hetzner as root when GitHub Actions deploy fails:
#   cd /opt/menuos && git pull origin main && bash scripts/fix-production.sh
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
cd "$ROOT"

echo "==> MenuOS production fix (APP_DIR=$ROOT)"
echo ""

if [ ! -f .env ]; then
  echo "ERROR: Missing $ROOT/.env"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

echo "==> Env check"
missing=0
for key in NEXTAUTH_SECRET; do
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
  if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U menuos -d menuos >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U menuos -d menuos -c "SELECT 1" >/dev/null 2>&1; then
  echo "  Postgres: OK"
else
  echo "  Postgres: FAIL — password in .env does not match the database volume."
  echo "  Fix POSTGRES_PASSWORD in $ROOT/.env (or reset volume if this is a fresh install)."
  echo "  Continuing anyway to rebuild the web container..."
fi

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
