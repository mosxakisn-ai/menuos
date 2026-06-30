#!/usr/bin/env bash
# Adopt existing /opt/menuos as a git checkout (keeps .env, no full re-clone).
# Usage (on server as root):
#   GITHUB_REPO=git@github.com:mosxakisn-ai/menuos.git bash scripts/server-git-adopt.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/menuos}"
GITHUB_REPO="${GITHUB_REPO:-git@github.com:mosxakisn-ai/menuos.git}"
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

if [ -d "$APP_DIR/.git" ]; then
  echo "Git already initialized at $APP_DIR"
  cd "$APP_DIR"
  git remote -v || true
  exit 0
fi

apt-get update -qq
apt-get install -y -qq git

cd "$APP_DIR"
git init
git remote add origin "$GITHUB_REPO" 2>/dev/null || git remote set-url origin "$GITHUB_REPO"
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
