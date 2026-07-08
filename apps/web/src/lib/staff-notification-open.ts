export type NotificationOpenTarget = {
  href: string;
  path: string;
  origin: string;
  waiterSlug: string | null;
};

export function resolveNotificationOpenTarget(
  rawUrl: string | null | undefined,
  origin: string,
): NotificationOpenTarget {
  try {
    const absolute = new URL(rawUrl || "/", origin);
    const pathname = absolute.pathname;
    const slugMatch = pathname.match(/^\/s\/([^/]+)/);
    return {
      href: absolute.href,
      path: `${pathname}${absolute.search}${absolute.hash}`,
      origin: absolute.origin,
      waiterSlug: slugMatch ? decodeURIComponent(slugMatch[1]!) : null,
    };
  } catch {
    return {
      href: `${origin}/`,
      path: "/",
      origin,
      waiterSlug: null,
    };
  }
}

export function clientMatchesNotificationTarget(
  clientUrl: string,
  target: NotificationOpenTarget,
): boolean {
  try {
    const client = new URL(clientUrl);
    if (client.origin !== target.origin) return false;
    if (client.href === target.href) return true;
    if (target.waiterSlug) {
      const clientSlugMatch = client.pathname.match(/^\/s\/([^/]+)/);
      const clientSlug = clientSlugMatch ? decodeURIComponent(clientSlugMatch[1]!) : null;
      if (clientSlug && clientSlug === target.waiterSlug) return true;
    }
    return client.pathname === new URL(target.href).pathname;
  } catch {
    return false;
  }
}

export function isWaiterPanelPathname(pathname: string): boolean {
  return pathname.startsWith("/s/") || pathname.startsWith("/dashboard/waiter");
}

export function pushTagKind(tag: string | null | undefined): "pass" | "waiter" | "other" {
  if (typeof tag !== "string") return "other";
  if (tag.startsWith("pass-")) return "pass";
  if (tag.startsWith("waiter-")) return "waiter";
  return "other";
}
