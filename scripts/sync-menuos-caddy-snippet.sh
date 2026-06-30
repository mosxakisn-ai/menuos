#!/usr/bin/env bash
# Replace the MenuOS block in MatchWork Caddyfile with docker/Caddyfile.snippet (idempotent).
set -euo pipefail
ROOT="${APP_DIR:-/opt/menuos}"
CADDY_FILE="${CADDY_FILE:-/opt/matchwork/docker/Caddyfile}"
SNIPPET="$ROOT/docker/Caddyfile.snippet"
MARKER="# Append to /opt/matchwork/docker/Caddyfile"

if [ ! -f "$SNIPPET" ]; then
  echo "ERROR: missing $SNIPPET"
  exit 1
fi

python3 - <<PY
from pathlib import Path

caddy = Path("$CADDY_FILE")
snippet = Path("$SNIPPET").read_text().rstrip() + "\n"
text = caddy.read_text()
marker = "$MARKER"
start = text.find(marker)
if start < 0:
    raise SystemExit(f"marker not found in {caddy}")

end = text.find("\n}", start)
if end < 0:
    raise SystemExit("menuos block end not found")
end += 2

new_text = text[:start] + snippet + "\n" + text[end:].lstrip("\n")
caddy.write_text(new_text)
print(f"Updated MenuOS block in {caddy}")
PY

docker exec matchwork-caddy-1 caddy reload --config /etc/caddy/Caddyfile
echo "Caddy reloaded."
