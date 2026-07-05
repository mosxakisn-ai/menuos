#!/usr/bin/env bash
# Clear fake waiter calls / pass signals / push subs on production.
# Usage: bash scripts/run-clear-venue-live-data-on-server.sh <venueSlug> [--history]
set -euo pipefail
SLUG="${1:-}"
EXTRA="${2:-}"
if [[ -z "$SLUG" ]]; then
  echo "Usage: $0 <venueSlug> [--history]"
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker exec menuos-menuos-web-1 node /opt/menuos/scripts/clear-venue-live-data.mjs "$SLUG" $EXTRA
