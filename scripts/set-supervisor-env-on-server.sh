#!/usr/bin/env bash
# One-off ops: set supervisor credentials in production .env (not committed).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
USER="${1:-}"
PASS="${2:-}"
if [[ -z "$USER" || -z "$PASS" ]]; then
  echo "Usage: $0 <username> <password>"
  exit 1
fi
python3 - "$ENV_FILE" "$USER" "$PASS" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
username = sys.argv[2]
password = sys.argv[3]
text = path.read_text() if path.exists() else ""
updates = {
    "SUPERVISOR_USERNAME": username,
    "SUPERVISOR_PASSWORD": password,
}
for key, value in updates.items():
    if key == "SUPERVISOR_PASSWORD":
        line = f'{key}="{value}"'
    else:
        line = f"{key}={value}"
    if re.search(f"^{re.escape(key)}=", text, re.M):
        text = re.sub(f"^{re.escape(key)}=.*$", line, text, flags=re.M)
    else:
        if text and not text.endswith("\n"):
            text += "\n"
        text += line + "\n"
path.write_text(text)
print("Supervisor env updated in", path)
PY
