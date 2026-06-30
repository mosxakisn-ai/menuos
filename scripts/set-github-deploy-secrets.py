#!/usr/bin/env python3
"""Set GitHub Actions secrets for menuos repo (requires GITHUB_TOKEN env)."""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request

REPO = "mosxakisn-ai/menuos"
API = f"https://api.github.com/repos/{REPO}"


def api(method: str, path: str, body: dict | None = None) -> dict:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        print("Set GITHUB_TOKEN (repo scope) to run this script.", file=sys.stderr)
        sys.exit(1)
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}


def encrypt_secret(public_key: str, secret_value: str) -> str:
    try:
        from nacl import encoding, public
    except ImportError:
        print("pip install pynacl", file=sys.stderr)
        sys.exit(1)
    pk = public.PublicKey(public_key.encode(), encoding.Base64Encoder())
    sealed = public.SealedBox(pk).encrypt(secret_value.encode())
    return base64.b64encode(sealed).decode()


def set_secret(name: str, value: str) -> None:
    key = api("GET", "/actions/secrets/public-key")
    api(
        "PUT",
        f"/actions/secrets/{name}",
        {
            "encrypted_value": encrypt_secret(key["key"], value),
            "key_id": key["key_id"],
        },
    )
    print(f"Set secret {name}")


def main() -> None:
    host = os.environ.get("SERVER_HOST", "188.34.195.62")
    user = os.environ.get("SERVER_USER", "root")
    key_path = os.environ.get(
        "SSH_PRIVATE_KEY_PATH",
        os.path.expanduser("~/.ssh/id_ed25519"),
    )
    with open(key_path, encoding="utf-8") as f:
        ssh_key = f.read()

    for name, val in [
        ("SERVER_HOST", host),
        ("SERVER_USER", user),
        ("SSH_PRIVATE_KEY", ssh_key),
    ]:
        set_secret(name, val)
    print("Done — GitHub Actions deploy should work on next push.")


if __name__ == "__main__":
    main()
