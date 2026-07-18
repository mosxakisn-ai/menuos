#!/usr/bin/env bash
# Post-deploy SEO smoke checks for menuos.gr
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
BASE="${APP_URL:-https://menuos.gr}"
BASE="${BASE%/}"

# shellcheck source=scripts/load-env.sh
source "$ROOT/scripts/load-env.sh"
load_env "$ROOT" 2>/dev/null || true

echo "==> SEO smoke checks ($BASE)"

check_url() {
  local path="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$path" || echo "000")"
  if [ "$code" = "200" ]; then
    echo "  OK $path ($code)"
  else
    echo "  FAIL $path ($code)"
    return 1
  fi
}

failed=0
check_url "/sitemap.xml" || failed=1
check_url "/sitemap-images.xml" || failed=1
check_url "/feed.xml" || failed=1
check_url "/llms.txt" || failed=1
check_url "/.well-known/llms.txt" || failed=1
check_url "/robots.txt" || failed=1
check_url "/pricing" || failed=1
check_url "/googlef328fb99f5f1f5b1.html" || failed=1

if [ -n "${INDEXNOW_KEY:-}" ]; then
  check_url "/${INDEXNOW_KEY}.txt" || failed=1
else
  echo "  SKIP IndexNow key file (INDEXNOW_KEY empty)"
fi

if [ -n "${GOOGLE_SITE_VERIFICATION:-}" ]; then
  if curl -sS "$BASE/" | grep -qi 'google-site-verification'; then
    echo "  OK GSC verification meta on homepage"
  else
    echo "  FAIL GSC token set but meta missing — recreate web container: docker compose -f docker-compose.prod.yml up -d menuos-web"
    failed=1
  fi
else
  echo "  WARN GOOGLE_SITE_VERIFICATION empty — add token from Search Console to .env"
fi

if curl -sS "$BASE/llms.txt" | grep -qE '\[[^]]+\]\(https://'; then
  echo "  OK llms.txt markdown links"
else
  echo "  FAIL llms.txt missing markdown links"
  failed=1
fi

if curl -sS "$BASE/llms.txt" | grep -qE '\{[a-zA-Z]+\}'; then
  echo "  FAIL llms.txt has unresolved {placeholders}"
  failed=1
else
  echo "  OK llms.txt no raw placeholders"
fi

if curl -sS "$BASE/llms.txt" | grep -qi 'Facts (for citations)'; then
  echo "  OK llms.txt citation Facts section"
else
  echo "  FAIL llms.txt missing Facts section"
  failed=1
fi

if curl -sS "$BASE/.well-known/llms.txt" | grep -qi 'MenuOS'; then
  echo "  OK /.well-known/llms.txt"
else
  echo "  FAIL /.well-known/llms.txt"
  failed=1
fi

sitemap_count="$(curl -sS "$BASE/sitemap.xml" | grep -c '<loc>' || true)"
if [ "${sitemap_count:-0}" -ge 140 ]; then
  echo "  OK sitemap.xml (${sitemap_count} URLs)"
else
  echo "  WARN sitemap.xml count ${sitemap_count:-0} (expected ~144+)"
fi

if [ "$failed" -eq 0 ]; then
  echo "==> SEO checks passed."
else
  echo "==> SEO checks had failures (non-fatal)."
fi

exit 0
