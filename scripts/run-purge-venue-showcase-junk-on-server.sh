#!/usr/bin/env bash
# Purge demo junk spots/calls (paralia, Όροφος, orphan «Χωρίς ρύθμιση») on production.
# Usage:
#   bash scripts/run-purge-venue-showcase-junk-on-server.sh <venueSlug>
#   bash scripts/run-purge-venue-showcase-junk-on-server.sh --all-customers
set -euo pipefail
SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "Usage: $0 <venueSlug> | --all-customers [--include-auli]"
  exit 1
fi
EXTRA="${*:2}"
docker exec menuos-menuos-web-1 node /opt/menuos/scripts/purge-venue-showcase-junk.mjs "$SLUG" $EXTRA
