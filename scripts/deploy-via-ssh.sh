#!/usr/bin/env bash
# Manual production deploy when GitHub Actions secrets are missing or SSH fails.
# Usage (from dev machine with SSH to Hetzner): bash scripts/deploy-via-ssh.sh
set -euo pipefail

HOST="${MENUOS_DEPLOY_HOST:-188.34.195.62}"
USER="${MENUOS_DEPLOY_USER:-root}"

echo "==> Deploy MenuOS on $USER@$HOST"
ssh -o BatchMode=yes -o ConnectTimeout=20 "$USER@$HOST" bash -s <<'REMOTE'
set -euo pipefail
APP_DIR="/opt/menuos"
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main
echo "Deployed commit: $(git rev-parse --short HEAD)"
chmod +x scripts/*.sh 2>/dev/null || true
APP_DIR="$APP_DIR" RUN_DB_PUSH=1 STRICT=0 bash scripts/fix-production.sh
REMOTE
echo "==> Deploy finished."
