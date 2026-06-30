#!/usr/bin/env bash
# Fetch /api/health from inside the menuos-web container (Alpine has no wget/curl by default).
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
COMPOSE=(docker compose -f "$ROOT/docker-compose.prod.yml")

"${COMPOSE[@]}" exec -T menuos-web node -e "
fetch('http://127.0.0.1:3000/api/health')
  .then((r) => r.text().then((t) => { console.log(t); process.exit(r.ok ? 0 : 1); }))
  .catch((e) => { console.error(e.message || e); process.exit(1); });
"
