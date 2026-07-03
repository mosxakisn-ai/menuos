const UNSPLASH_HOST = "images.unsplash.com";

function withSearchParams(url: string, mutate: (parsed: URL) => void): string {
  try {
    const parsed = new URL(url, "https://menuos.gr");
    mutate(parsed);
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return parsed.toString();
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/** Menu card thumbnails (~235px display) — avoid loading 900px Unsplash assets. */
export function optimizeMenuCardPhotoUrl(url: string, displayWidth = 280): string {
  const w = Math.min(640, Math.ceil(displayWidth * 2));
  return withSearchParams(url, (parsed) => {
    if (parsed.hostname === UNSPLASH_HOST) {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(w));
      parsed.searchParams.set("h", String(Math.ceil(w * 0.75)));
      parsed.searchParams.set("q", "75");
      return;
    }
    if (parsed.pathname.includes("/api/photos/serve/")) {
      parsed.searchParams.set("w", String(w));
    }
  });
}

/** Venue logo in QR header (40–56px display). */
export function optimizeMenuLogoUrl(url: string, displaySize = 56): string {
  const w = Math.min(128, Math.ceil(displaySize * 2));
  return withSearchParams(url, (parsed) => {
    if (parsed.hostname === UNSPLASH_HOST) {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(w));
      parsed.searchParams.set("h", String(w));
      parsed.searchParams.set("q", "80");
      return;
    }
    if (parsed.pathname.includes("/api/photos/serve/")) {
      parsed.searchParams.set("w", String(w));
    }
  });
}
