#!/usr/bin/env bash
# Ensure INDEXNOW_KEY and RUN_INDEXNOW=1 in .env (idempotent).
set -euo pipefail

ROOT="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
ENV_FILE="$ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "No .env at $ENV_FILE"
  exit 1
fi

export ENV_FILE="$ENV_FILE"

python3 << 'PY'
import re
import secrets
from pathlib import Path

p = Path(__import__("os").environ["ENV_FILE"])
text = p.read_text()

key_m = re.search(r"^INDEXNOW_KEY=(.*)$", text, re.M)
if not key_m or not key_m.group(1).strip():
    key = secrets.token_hex(16)
    if key_m:
        text = re.sub(r"^INDEXNOW_KEY=.*$", f"INDEXNOW_KEY={key}", text, flags=re.M)
    else:
        text = text.rstrip() + f"\nINDEXNOW_KEY={key}\n"
    print("INDEXNOW_KEY set (new)")
else:
    print("INDEXNOW_KEY already set")

if re.search(r"^RUN_INDEXNOW=", text, re.M):
    text = re.sub(r"^RUN_INDEXNOW=.*$", "RUN_INDEXNOW=1", text, flags=re.M)
else:
    text = text.rstrip() + "\nRUN_INDEXNOW=1\n"
print("RUN_INDEXNOW=1")

p.write_text(text)
PY
