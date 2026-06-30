#!/usr/bin/env bash
# One-shot production repair on Hetzner (run as root in /opt/menuos).
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
cd "$ROOT"

echo "==> Sync mail from MatchWork if needed"
if ! grep -q '^MAILBOX_PASSWORD=.' .env 2>/dev/null; then
  if [ -f /opt/matchwork/.env ]; then
    MW_PASS="$(grep '^MAILBOX_PASSWORD=' /opt/matchwork/.env | cut -d= -f2- | tr -d '"')"
    if [ -n "$MW_PASS" ]; then
      if grep -q '^MAILBOX_PASSWORD=' .env; then
        sed -i "s|^MAILBOX_PASSWORD=.*|MAILBOX_PASSWORD=$MW_PASS|" .env
      else
        printf 'MAILBOX_PASSWORD=%s\n' "$MW_PASS" >> .env
      fi
      echo "    MAILBOX_PASSWORD synced from MatchWork"
    fi
  fi
fi

grep -q '^MAILBOX_USER=' .env || echo 'MAILBOX_USER=admin@s1cloud.b-os.gr' >> .env
grep -q '^APP_URL=' .env || echo 'APP_URL=https://menuos.gr' >> .env
grep -q '^NEXTAUTH_URL=' .env || echo 'NEXTAUTH_URL=https://menuos.gr' >> .env

if ! grep -q '^NEXTAUTH_SECRET=.' .env; then
  SECRET="$(openssl rand -base64 32 | tr -d '\n')"
  echo "NEXTAUTH_SECRET=$SECRET" >> .env
  echo "    Generated NEXTAUTH_SECRET"
fi

# DATABASE_URL must match POSTGRES_PASSWORD in compose
if grep -q '^POSTGRES_PASSWORD=' .env; then
  PG_PASS="$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2- | tr -d '"')"
  URL="postgresql://menuos:${PG_PASS}@menuos-db:5432/menuos"
  if grep -q '^DATABASE_URL=' .env; then
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$URL|" .env
  else
    echo "DATABASE_URL=$URL" >> .env
  fi
  echo "    DATABASE_URL aligned with POSTGRES_PASSWORD"
fi

chmod +x scripts/*.sh
APP_DIR="$ROOT" RUN_DB_PUSH=1 STRICT=0 bash scripts/fix-production.sh
