#!/usr/bin/env bash
# Reset public demo waiter calls (demo-taverna). Run every 15 minutes on server:
#   */15 * * * * /opt/menuos/scripts/run-demo-cleanup-on-server.sh >> /var/log/menuos-demo-cleanup.log 2>&1
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
curl -fsS -X POST "${APP%/}/api/cron/demo-cleanup" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json"
echo
