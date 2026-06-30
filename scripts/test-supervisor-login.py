#!/usr/bin/env python3
"""One-off ops script: test supervisor login using password from env file or argv."""
import json
import os
import re
import ssl
import sys
import urllib.error
import urllib.request
import http.cookiejar

BASE = os.environ.get("MENUOS_URL", "https://menuos.gr")
ENV_PATH = os.environ.get("MENUOS_ENV", "/opt/menuos/.env")


def read_password_from_env(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^SUPERVISOR_PASSWORD=(.*)$", line.rstrip("\n"))
            if m:
                val = m.group(1).strip()
                if (val.startswith('"') and val.endswith('"')) or (
                    val.startswith("'") and val.endswith("'")
                ):
                    val = val[1:-1]
                return val
    raise SystemExit(f"SUPERVISOR_PASSWORD not found in {path}")


def main() -> None:
    password = sys.argv[1] if len(sys.argv) > 1 else read_password_from_env(ENV_PATH)
    username = os.environ.get("SUPERVISOR_USERNAME", "manolis1974")

    data = json.dumps({"username": username, "password": password}).encode()
    req = urllib.request.Request(
        f"{BASE}/api/supervisor/login",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    ctx = ssl.create_default_context()
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cj),
        urllib.request.HTTPSHandler(context=ctx),
    )

    try:
        r = opener.open(req)
        print("login", r.status, r.read().decode())
    except urllib.error.HTTPError as e:
        print("login err", e.code, e.read().decode())
        sys.exit(1)

    req2 = urllib.request.Request(f"{BASE}/api/supervisor/overview")
    try:
        r2 = opener.open(req2)
        body = r2.read().decode()
        print("overview", r2.status, body[:400])
    except urllib.error.HTTPError as e:
        print("overview err", e.code, e.read().decode())
        sys.exit(1)

    req3 = urllib.request.Request(f"{BASE}/supervisor")
    try:
        r3 = opener.open(req3)
        print("panel_page", r3.status, r3.geturl())
    except urllib.error.HTTPError as e:
        print("panel_page err", e.code, e.geturl() if hasattr(e, "geturl") else "")


if __name__ == "__main__":
    main()
