#!/usr/bin/env bash
# Purge demo junk spots/calls and scrub orphan quick chips on production.
# Usage:
#   bash scripts/run-purge-venue-showcase-junk-on-server.sh <venueSlug>
#   bash scripts/run-purge-venue-showcase-junk-on-server.sh demo-taverna --include-auli
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="${1:-}"
if [[ -z "$SLUG" ]]; then
  echo "Usage: $0 <venueSlug> | --all-customers [--include-auli]"
  exit 1
fi
shift || true
cd "$ROOT"
node scripts/purge-venue-showcase-junk.mjs "$SLUG" "$@"
