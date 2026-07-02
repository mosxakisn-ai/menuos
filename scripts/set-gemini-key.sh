#!/usr/bin/env bash
# Set GEMINI_API_KEY in .env and ensure PDF import AI vars exist.
# Usage: bash scripts/set-gemini-key.sh YOUR_GEMINI_API_KEY
# Accepts AIzaSy... (legacy) or AQ.Ab... (auth keys, default in AI Studio 2026).
# On prod after key: APP_DIR=/opt/menuos bash scripts/set-gemini-key.sh KEY && docker compose -f docker-compose.prod.yml up -d menuos-web
set -euo pipefail

KEY="${1:-}"
if [ -z "$KEY" ]; then
  echo "Usage: bash scripts/set-gemini-key.sh YOUR_GEMINI_API_KEY"
  echo "Create free key: https://aistudio.google.com/apikey (AIzaSy... or AQ.Ab...)"
  exit 1
fi

if [[ ! "$KEY" =~ ^AIza[0-9A-Za-z_-]{20,}$ ]] && [[ ! "$KEY" =~ ^AQ\.[0-9A-Za-z_-]{20,}$ ]]; then
  echo "ERROR: key should look like AIzaSy... or AQ.Ab... (from Google AI Studio, not a project ID)."
  exit 1
fi

ROOT="${APP_DIR:-$(pwd)}"
ENV_FILE="$ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: missing $ENV_FILE — run scripts/ensure-env.sh first"
  exit 1
fi

bash "$ROOT/scripts/ensure-env.sh"

set_or_append() {
  local name="$1"
  local value="$2"
  if grep -q "^${name}=" "$ENV_FILE" 2>/dev/null; then
    sed -i.bak "s|^${name}=.*|${name}=${value}|" "$ENV_FILE"
    rm -f "$ENV_FILE.bak"
  else
    echo "${name}=${value}" >> "$ENV_FILE"
  fi
}

set_or_append GEMINI_API_KEY "$KEY"
set_or_append PDF_IMPORT_VISION "1"
set_or_append PDF_IMPORT_VISION_MODE "auto"
set_or_append GEMINI_MODEL "gemini-2.5-flash"

echo "Updated GEMINI_API_KEY in $ENV_FILE"
echo "Verify: bash scripts/check-gemini-key.sh"
