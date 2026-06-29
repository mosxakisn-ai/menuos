#!/usr/bin/env bash
# One-time: connect /opt/menuos to GitHub (keeps existing .env)
# Usage (on server as root):
#   GITHUB_REPO=git@github.com:mosxakisn-ai/menuos.git bash scripts/server-git-init.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/menuos}"
GITHUB_REPO="${GITHUB_REPO:-git@github.com:mosxakisn-ai/menuos.git}"
BACKUP_ENV="/tmp/menuos.env.backup.$$"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root"
  exit 1
fi

if [ -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env" "$BACKUP_ENV"
  echo "Backed up .env to $BACKUP_ENV"
fi

if [ -d "$APP_DIR/.git" ]; then
  echo "Git repo already exists at $APP_DIR"
  cd "$APP_DIR"
  git remote -v
  exit 0
fi

apt-get update -qq
apt-get install -y -qq git

if [ -d "$APP_DIR" ] && [ "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
  mv "$APP_DIR" "${APP_DIR}.bak.$(date +%s)"
fi

git clone "$GITHUB_REPO" "$APP_DIR"
cd "$APP_DIR"

if [ -f "$BACKUP_ENV" ]; then
  cp "$BACKUP_ENV" "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "Restored .env"
fi

chmod +x scripts/server-deploy.sh 2>/dev/null || true
echo "Done. Push to main on GitHub to trigger deploy, or run: bash scripts/server-deploy.sh"
