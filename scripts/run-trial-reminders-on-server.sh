#!/usr/bin/env bash
# Daily trial reminder emails (mid-trial, ending, expired).
# On server: add to crontab, e.g. 09:00 Athens time:
#   0 7 * * * /opt/menuos/scripts/run-trial-reminders-on-server.sh >> /var/log/menuos-trial-reminders.log 2>&1
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
curl -fsS -X POST "${APP%/}/api/cron/trial-reminders" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json"
echo
