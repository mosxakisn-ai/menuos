#!/usr/bin/env bash
# Append missing keys from .env.example into .env (does not overwrite existing values).
set -euo pipefail

ROOT="${APP_DIR:-$(pwd)}"
EXAMPLE="$ROOT/.env.example"
ENV_FILE="$ROOT/.env"

if [ ! -f "$EXAMPLE" ]; then
  echo "ERROR: missing $EXAMPLE"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  cp "$EXAMPLE" "$ENV_FILE"
  echo "Created $ENV_FILE from .env.example"
  exit 0
fi

added=0
while IFS= read -r line || [ -n "$line" ]; do
  line="${line//$'\r'/}"
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ "$line" =~ ^[[:space:]]*$ ]] && continue
  [[ "$line" =~ ^=== ]] && continue
  key="${line%%=*}"
  key="$(echo "$key" | tr -d '[:space:]')"
  [ -n "$key" ] || continue
  if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    echo "$line" >> "$ENV_FILE"
    echo "  + $key"
    added=$((added + 1))
  fi
done < "$EXAMPLE"

if [ "$added" -eq 0 ]; then
  echo "All keys from .env.example present in .env"
else
  echo "Added $added key(s) to .env"
fi
