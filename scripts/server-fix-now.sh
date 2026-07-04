#!/usr/bin/env bash
# One-shot production repair on Hetzner (run as root in /opt/menuos).
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
cd "$ROOT"

bash "$ROOT/scripts/ensure-env.sh"

# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT"

echo "==> Sync mail from MatchWork if needed"
if [ -z "${MAILBOX_PASSWORD:-}" ] && [ -f /opt/matchwork/.env ]; then
  MW_PASS="$(grep '^MAILBOX_PASSWORD=' /opt/matchwork/.env | cut -d= -f2- | tr -d '"')"
  if [ -n "$MW_PASS" ]; then
    if grep -q '^MAILBOX_PASSWORD=' .env; then
      sed -i "s|^MAILBOX_PASSWORD=.*|MAILBOX_PASSWORD=$MW_PASS|" .env
    else
      printf 'MAILBOX_PASSWORD=%s\n' "$MW_PASS" >> .env
    fi
    export MAILBOX_PASSWORD="$MW_PASS"
    echo "    MAILBOX_PASSWORD synced from MatchWork"
  fi
fi

if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  SECRET="$(openssl rand -base64 32 | tr -d '\n')"
  if grep -q '^NEXTAUTH_SECRET=' .env; then
    sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$SECRET|" .env
  else
    echo "NEXTAUTH_SECRET=$SECRET" >> .env
  fi
  export NEXTAUTH_SECRET="$SECRET"
  echo "    Generated NEXTAUTH_SECRET"
fi

bash "$ROOT/scripts/align-postgres-password.sh"

if [ -f "$ROOT/scripts/align-menuos-stripe-on-server.sh" ]; then
  bash "$ROOT/scripts/align-menuos-stripe-on-server.sh"
fi

chmod +x scripts/*.sh
APP_DIR="$ROOT" RUN_DB_PUSH="${RUN_DB_PUSH:-1}" STRICT="${STRICT:-0}" bash scripts/fix-production.sh
