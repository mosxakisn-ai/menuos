#!/usr/bin/env bash
# Quick check that GEMINI_API_KEY works (uses 1 free-tier API call).
set -euo pipefail

ROOT="${APP_DIR:-$(pwd)}"
# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT"

KEY="${GEMINI_API_KEY:-}"
MODEL="${GEMINI_MODEL:-gemini-2.5-flash}"

if [ -z "$KEY" ]; then
  echo "FAIL: GEMINI_API_KEY is empty in $ROOT/.env"
  echo "Create free key: https://aistudio.google.com/apikey"
  echo "Then: bash scripts/set-gemini-key.sh YOUR_GEMINI_API_KEY"
  exit 1
fi

URL="https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}"
PAYLOAD='{"contents":[{"parts":[{"text":"Reply with exactly: ok"}]}],"generationConfig":{"maxOutputTokens":8}}'

HTTP="$(curl -sS -o /tmp/gemini-check.json -w "%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "$URL")"

if [ "$HTTP" = "200" ]; then
  echo "OK: Gemini ${MODEL} responded (HTTP 200). PDF import AI is ready."
  exit 0
fi

echo "FAIL: Gemini HTTP ${HTTP}"
if command -v jq >/dev/null 2>&1; then
  jq -r '.error.message // .' /tmp/gemini-check.json 2>/dev/null || cat /tmp/gemini-check.json
else
  cat /tmp/gemini-check.json
fi
exit 1
