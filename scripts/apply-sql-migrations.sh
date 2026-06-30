#!/usr/bin/env bash
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
MIGRATIONS_DIR="$ROOT/scripts/migrations"

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
    psql -v ON_ERROR_STOP=1 -U menuos -d menuos < "$f"
done
echo "==> SQL migrations done."
