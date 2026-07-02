const UNREACHABLE_HOSTS = new Set(["0.0.0.0", "[::]", "::"]);

function serverAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "https://menuos.gr"
  ).replace(/\/$/, "");
}

export function isUnreachableBrowserHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return UNREACHABLE_HOSTS.has(h);
}

/** Public site URL — client uses NEXT_PUBLIC_APP_URL; server falls back to APP_URL. */
export function getPublicAppUrl(): string {
  return serverAppUrl();
}

function originFromForwardedHeaders(request: Request): string | null {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (!host) return null;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";
  return `${proto}://${host}`;
}

/** Safe origin for redirects and share links — never 0.0.0.0; respects reverse proxy. */
export function resolvePublicOrigin(requestOrOrigin?: Request | string): string {
  if (requestOrOrigin instanceof Request) {
    const forwarded = originFromForwardedHeaders(requestOrOrigin);
    if (forwarded) {
      try {
        const url = new URL(forwarded);
        if (!isUnreachableBrowserHost(url.hostname)) return url.origin;
      } catch {
        /* fall through */
      }
    }
    return resolvePublicOrigin(new URL(requestOrOrigin.url).origin);
  }

  const publicBase = getPublicAppUrl();

  if (!requestOrOrigin) return publicBase;

  try {
    const url = new URL(requestOrOrigin);
    if (isUnreachableBrowserHost(url.hostname)) return publicBase;
    return url.origin;
  } catch {
    return publicBase;
  }
}
