#!/usr/bin/env bash
# Safe Caddy reload for MatchWork's shared reverse proxy — never break matchwork.gr.
set -euo pipefail

CADDY_CONTAINER="${CADDY_CONTAINER:-matchwork-caddy-1}"
CADDY_CONFIG="${CADDY_CONFIG:-/etc/caddy/Caddyfile}"

reload_matchwork_caddy_safe() {
  local reason="${1:-MenuOS deploy}"

  if ! docker ps --format '{{.Names}}' | grep -qx "$CADDY_CONTAINER"; then
    echo "WARN: Caddy container '$CADDY_CONTAINER' not running — skip reload ($reason)"
    return 0
  fi

  echo "==> Caddy validate before reload ($reason)..."
  if ! docker exec "$CADDY_CONTAINER" caddy validate --config "$CADDY_CONFIG"; then
    echo "ERROR: Caddy validate failed — reload skipped to protect matchwork.gr and menuos.gr"
    return 1
  fi

  echo "==> Caddy reload ($reason)..."
  docker exec "$CADDY_CONTAINER" caddy reload --config "$CADDY_CONFIG"
}

ensure_menuos_caddy_routing() {
  local root="${1:-/opt/menuos}"
  local caddy_file="${2:-/opt/matchwork/docker/Caddyfile}"
  local marker="${3:-# Append to /opt/matchwork/docker/Caddyfile — MenuOS (menuos.gr)}"
  local state_file="${4:-$root/data/.menuos-caddy-active}"

  # shellcheck source=scripts/lib/caddy-reload.sh
  source "$root/scripts/lib/caddy-reload.sh"

  local needs_reload=0
  if [ ! -f "$caddy_file" ] || ! grep -q "$marker" "$caddy_file" 2>/dev/null; then
    if [ ! -f "$root/docker/Caddyfile.snippet" ]; then
      echo "ERROR: missing $root/docker/Caddyfile.snippet"
      return 1
    fi
    echo "==> Adding MenuOS to Caddy (first-time append)..."
    cat "$root/docker/Caddyfile.snippet" >> "$caddy_file"
    needs_reload=1
  elif [ ! -f "$state_file" ]; then
    echo "==> MenuOS Caddy block present but reload not confirmed — retry reload"
    needs_reload=1
  elif [ "${MENUOS_RELOAD_CADDY:-0}" = "1" ]; then
    needs_reload=1
  fi

  if [ "$needs_reload" = "0" ]; then
    echo "==> Skip Caddy reload — MenuOS routing active (MatchWork untouched)"
    return 0
  fi

  if reload_matchwork_caddy_safe "MenuOS routing on MatchWork Caddy"; then
    mkdir -p "$(dirname "$state_file")"
    date -Iseconds > "$state_file"
    return 0
  fi

  rm -f "$state_file"
  echo "ERROR: Caddy reload failed — menuos.gr may be down until reload succeeds"
  return 1
}
