#!/usr/bin/env bash
# Remove test waiter calls accidentally created on a real venue during dev simulation.
# Does NOT touch demo-taverna cron cleanup or any other venue.
# Usage: bash scripts/cleanup-simulation-calls-on-server.sh <venueSlug> <tableNumber>
set -euo pipefail
VENUE_SLUG="${1:-}"
TABLE="${2:-}"
if [[ -z "$VENUE_SLUG" || -z "$TABLE" ]]; then
  echo "Usage: $0 <venueSlug> <tableNumber>"
  exit 1
fi
if [[ "$VENUE_SLUG" == "demo-taverna" ]]; then
  echo "Use /api/cron/demo-cleanup for demo-taverna — not this script."
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
docker exec menuos-menuos-web-1 node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slug = process.argv[1];
const table = process.argv[2];
prisma.venue.findUnique({ where: { slug }, select: { id: true, name: true } })
  .then(async (v) => {
    if (!v) { console.log('venue not found'); process.exit(1); }
    const r = await prisma.waiterCall.deleteMany({
      where: { venueId: v.id, tableNumber: table, status: 'PENDING' },
    });
    console.log(JSON.stringify({ venue: v.name, table, deletedPending: r.count }));
  })
  .finally(() => prisma.\$disconnect());
" "$VENUE_SLUG" "$TABLE"
