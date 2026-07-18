/** Query params that should not be indexed (`noindex`). `lang` is allowed (self-canonical + hreflang). */
export type HomepageSearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
}

export function homepageHasNonCanonicalParams(params: HomepageSearchParams): boolean {
  for (const [key, value] of Object.entries(params)) {
    if (key === "lang") continue;
    if (firstParam(value)) return true;
  }
  return false;
}
