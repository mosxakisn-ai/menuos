#!/usr/bin/env bash
# Import a scanned PDF into a customer menu (production support).
# Usage: bash scripts/run-admin-import-on-server.sh <email> [pdf-path] [--replace]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source scripts/load-env.sh
load_env "$ROOT"

EMAIL="${1:-}"
PDF="${2:-apps/web/test-fixtures/pdf/stegnakozas-menu-25.pdf}"
shift 2 2>/dev/null || true
EXTRA_ARGS=("$@")

if [ -z "$EMAIL" ]; then
  echo "Usage: bash scripts/run-admin-import-on-server.sh <email> [pdf-path] [--replace] [--dry-run]"
  exit 1
fi

DB_URL="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv DATABASE_URL)"
OCR_KEY="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv OCR_SPACE_API_KEY || true)"
GEMINI_KEY="$(docker compose -f docker-compose.prod.yml exec -T menuos-web printenv GEMINI_API_KEY || true)"
if [ -z "$DB_URL" ]; then
  echo "ERROR: could not read DATABASE_URL from menuos-web"
  exit 1
fi
if [ -z "$OCR_KEY" ]; then
  echo "WARN: OCR_SPACE_API_KEY empty — scanned PDF import will fail"
fi

echo "==> Import for $EMAIL"
echo "    PDF: $PDF"

docker run --rm --network menuos_default \
  -e DATABASE_URL="$DB_URL" \
  -e OCR_SPACE_API_KEY="$OCR_KEY" \
  -e GEMINI_API_KEY="$GEMINI_KEY" \
  -e OCR_SPACE_LANGUAGE="${OCR_SPACE_LANGUAGE:-gre}" \
  -v "$ROOT:/app" \
  -w /app \
  node:20-bookworm-slim \
  bash -lc "
    set -euo pipefail
    if [ ! -d node_modules/@menuos/db ]; then
      echo '==> Installing dependencies (first run only)...'
      apt-get update -qq && apt-get install -y -qq openssl ca-certificates >/dev/null
      npm ci
      npm run db:generate
    fi
    npx tsx --tsconfig apps/web/tsconfig.json apps/web/scripts/admin-import-customer-menu.ts '$EMAIL' '$PDF' ${EXTRA_ARGS[*]:-}
  "

echo "==> Import finished."
