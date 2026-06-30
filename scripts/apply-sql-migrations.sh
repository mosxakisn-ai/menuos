#!/usr/bin/env bash
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
MIGRATIONS_DIR="$ROOT/scripts/migrations"

# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT" 2>/dev/null || true
PG_USER="${POSTGRES_USER:-menuos}"
PG_DB="${POSTGRES_DB:-menuos}"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "No SQL migrations directory — skipping."
  exit 0
fi

shopt -s nullglob
files=("$MIGRATIONS_DIR"/*.sql)
if [ ${#files[@]} -eq 0 ]; then
  echo "No SQL migration files — skipping."
  exit 0
fi

echo "==> Applying SQL migrations..."
for f in "${files[@]}"; do
  echo "    → $(basename "$f")"
  docker compose -f "$ROOT/$COMPOSE_FILE" exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" < "$f"
done
echo "==> SQL migrations done."
