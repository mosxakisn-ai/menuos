#!/usr/bin/env bash
# Ensure MenuOS Stripe keys are set on production (run on Hetzner in /opt/menuos).
# Uses the CloudEra Stripe account key from MatchWork only when MenuOS keys are empty.
set -euo pipefail

ROOT="${APP_DIR:-/opt/menuos}"
ENV_FILE="$ROOT/.env"
MW_ENV="/opt/matchwork/.env"

cd "$ROOT"

read_env_val() {
  local file="$1"
  local key="$2"
  grep "^${key}=" "$file" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d '\r' || true
}

set_env_val() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

menuos_key="$(read_env_val "$ENV_FILE" MENUOS_STRIPE_SECRET_KEY)"
menuos_whsec="$(read_env_val "$ENV_FILE" MENUOS_STRIPE_WEBHOOK_SECRET)"

if [ -z "$menuos_key" ] && [ -f "$MW_ENV" ]; then
  mw_key="$(read_env_val "$MW_ENV" MATCHWORK_STRIPE_SECRET_KEY)"
  if [ -n "$mw_key" ]; then
    set_env_val MENUOS_STRIPE_SECRET_KEY "$mw_key"
    menuos_key="$mw_key"
    echo "    MENUOS_STRIPE_SECRET_KEY synced from MatchWork Stripe account"
  fi
fi

if [ -z "$menuos_key" ]; then
  echo "    WARN: MENUOS_STRIPE_SECRET_KEY still empty — add sk_live key to $ENV_FILE"
  exit 0
fi

if [ -z "$menuos_whsec" ]; then
  echo "    Setting up MenuOS Stripe webhook..."
  if command -v node >/dev/null 2>&1; then
    MENUOS_STRIPE_SECRET_KEY="$menuos_key" node "$ROOT/scripts/setup-menuos-stripe.mjs" --write-env="$ENV_FILE" || true
  else
    echo "    WARN: node not on host — run setup-menuos-stripe.mjs manually for webhook secret"
  fi
fi
