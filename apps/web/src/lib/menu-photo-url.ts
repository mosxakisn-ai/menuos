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

const UNSPLASH_HOST = "images.unsplash.com";

function unsplashQuality(displayWidth: number): string {
  if (displayWidth <= 140) return "55";
  if (displayWidth <= 200) return "58";
  return "60";
}

/** Menu card thumbnails — 2× display width for retina; cap avoids oversized Unsplash fetches. */
export function optimizeMenuCardPhotoUrl(url: string, displayWidth = 240): string {
  const w = Math.min(displayWidth <= 200 ? 360 : 440, Math.ceil(displayWidth * 2));
  const quality = unsplashQuality(displayWidth);
  return withSearchParams(url, (parsed) => {
    if (parsed.hostname === UNSPLASH_HOST) {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(w));
      parsed.searchParams.set("h", String(Math.ceil(w * 0.75)));
      parsed.searchParams.set("q", quality);
      return;
    }
    if (parsed.pathname.includes("/api/photos/serve/")) {
      parsed.searchParams.set("w", String(w));
    }
  });
}

/** Hero / marketing cover photos (next/image still benefits from a smaller remote source). */
export function optimizeCoverPhotoUrl(url: string, displayWidth = 440): string {
  const w = Math.min(640, Math.ceil(displayWidth * 1.5));
  return withSearchParams(url, (parsed) => {
    if (parsed.hostname === UNSPLASH_HOST) {
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      parsed.searchParams.set("w", String(w));
      parsed.searchParams.set("h", String(Math.ceil(w * 0.75)));
      parsed.searchParams.set("q", "65");
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
