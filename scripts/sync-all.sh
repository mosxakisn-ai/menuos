#!/usr/bin/env bash
# Full MenuOS production sync: git code + DB schema + SQL migrations + rebuild + health check.
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
export APP_DIR="$ROOT"
export RUN_DB_PUSH="${RUN_DB_PUSH:-1}"
export STRICT="${STRICT:-1}"

# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT" 2>/dev/null || true
RUN_DB_PUSH="${RUN_DB_PUSH:-1}"
STRICT="${STRICT:-1}"

echo "==> MenuOS sync-all (APP_DIR=$ROOT, STRICT=$STRICT)"
bash "$ROOT/scripts/server-deploy.sh"

echo "==> Post-sync health check..."
sleep 4

HEALTH_JSON=""
if HEALTH_JSON="$(bash "$ROOT/scripts/health-check.sh" 2>/dev/null)"; then
  echo "$HEALTH_JSON"
  if echo "$HEALTH_JSON" | grep -q '"database":"ok"'; then
    echo "==> Sync OK — database connected."
    exit 0
  fi
  echo "WARN: App running but database check failed."
  echo "      Fix POSTGRES_PASSWORD in $ROOT/.env and re-run: APP_DIR=$ROOT bash scripts/sync-all.sh"
  if [ "$STRICT" = "1" ]; then
    exit 1
  fi
  exit 0
fi

echo "ERROR: /api/health unreachable inside container."
docker compose -f "$ROOT/docker-compose.prod.yml" logs menuos-web --tail 40 || true
if [ "$STRICT" = "1" ]; then
  exit 1
fi
exit 0
