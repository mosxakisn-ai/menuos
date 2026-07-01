#!/usr/bin/env bash
# Delete delivered pass signals older than 90 days. Run daily on server:
#   15 3 * * * /opt/menuos/scripts/run-pass-signal-cleanup-on-server.sh >> /var/log/menuos-pass-signal-cleanup.log 2>&1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source scripts/load-env.sh
load_env "$ROOT"
SECRET="${CRON_SECRET:-}"
APP="${APP_URL:-https://menuos.gr}"
if [[ -z "$SECRET" ]]; then
  echo "CRON_SECRET is not set in .env"
  exit 1
fi
curl -fsS -X POST "${APP%/}/api/cron/pass-signal-cleanup" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json"
echo
