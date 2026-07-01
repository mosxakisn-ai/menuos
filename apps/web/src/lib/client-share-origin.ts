/** Origin for copied share links — 0.0.0.0 is a bind address, not reachable in browsers. */
export function clientShareOrigin(): string {
  if (typeof window === "undefined") return "";
  const { protocol, hostname, port } = window.location;
  const host =
    hostname === "0.0.0.0" || hostname === "[::]" || hostname === "::"
      ? "localhost"
      : hostname;
  const portSuffix = port ? `:${port}` : "";
  return `${protocol}//${host}${portSuffix}`;
}
