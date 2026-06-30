#!/usr/bin/env bash
# Source .env from APP_DIR (or cwd). Strips Windows CRLF.
load_env() {
  local root="${1:-${APP_DIR:-$(pwd)}}"
  local file="$root/.env"
  if [ ! -f "$file" ]; then
    echo "ERROR: missing $file" >&2
    return 1
  fi
  sed -i 's/\r$//' "$file" 2>/dev/null || sed -i '' 's/\r$//' "$file" 2>/dev/null || true
  set -a
  # shellcheck disable=SC1091
  source "$file"
  set +a
}

# Apply production host defaults when APP_URL points to menuos.gr (server only).
apply_production_env_defaults() {
  local env_file="${1:-.env}"
  if [[ "${APP_URL:-}" != *menuos.gr* ]]; then
    return 0
  fi
  local tmp
  tmp="$(mktemp)"
  while IFS= read -r line || [ -n "$line" ]; do
    line="${line//$'\r'/}"
    case "$line" in
      DATABASE_HOST=*) echo "DATABASE_HOST=menuos-db" ;;
      DATABASE_PORT=*) echo "DATABASE_PORT=5432" ;;
      NODE_ENV=*) echo "NODE_ENV=production" ;;
      *) echo "$line" ;;
    esac
  done < "$env_file" > "$tmp"
  mv "$tmp" "$env_file"
  echo "Applied production defaults (menuos-db, port 5432) to $env_file"
}

# Build DATABASE_URL from .env parts.
build_database_url() {
  POSTGRES_USER="${POSTGRES_USER:-menuos}"
  POSTGRES_DB="${POSTGRES_DB:-menuos}"
  DATABASE_HOST="${DATABASE_HOST:-menuos-db}"
  DATABASE_PORT="${DATABASE_PORT:-5432}"
  if [ -z "${POSTGRES_PASSWORD:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
    POSTGRES_PASSWORD="$(echo "$DATABASE_URL" | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')"
  fi
  echo "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${POSTGRES_DB}"
}
