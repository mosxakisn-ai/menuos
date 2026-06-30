#!/usr/bin/env bash
# Adopt /opt/menuos for git-based deploy (keeps .env). Uses HTTPS (public repo).
# Usage (on server as root):
#   bash scripts/server-git-adopt.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/menuos}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/mosxakisn-ai/menuos.git}"
BACKUP_ENV="/tmp/menuos.env.backup.$$"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: $APP_DIR does not exist"
  exit 1
fi

if [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" "$BACKUP_ENV"
  echo "Backed up .env"
fi

apt-get update -qq
apt-get install -y -qq git

cd "$APP_DIR"

if [ ! -d .git ]; then
  git init
  git remote add origin "$GITHUB_REPO"
else
  git remote set-url origin "$GITHUB_REPO" 2>/dev/null || git remote add origin "$GITHUB_REPO"
fi

git fetch origin main
git checkout -B main
git reset --hard origin/main

if [ -f "$BACKUP_ENV" ]; then
  cp "$BACKUP_ENV" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "Restored .env"
fi

chmod +x scripts/*.sh 2>/dev/null || true
echo "Done. GitHub Actions deploy will work on next push to main."
