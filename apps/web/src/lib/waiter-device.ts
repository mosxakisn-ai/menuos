export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line\/|MicroMessenger|Messenger|WhatsApp|Twitter|LinkedInApp/i.test(ua);
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isIosStandalonePwa(): boolean {
  return isStandalonePwa();
}

/** Installed PWA (home screen icon) — iOS standalone or Android display-mode. */
export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}
