/** Normalize pasted Google review links (add https:// when missing). */
export function normalizeGoogleReviewUrlInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isLikelyGoogleReviewUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "g.page" ||
      host.endsWith(".g.page") ||
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "goo.gl" ||
      host.endsWith(".goo.gl") ||
      host === "maps.app.goo.gl"
    );
  } catch {
    return false;
  }
}
