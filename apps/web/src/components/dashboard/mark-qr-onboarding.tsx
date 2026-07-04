"use client";

import { useEffect, useRef } from "react";

/** Marks QR onboarding visit (httpOnly cookie). Idempotent — safe to call on QR page load. */
export function MarkQrOnboarding() {
  const marked = useRef(false);

  useEffect(() => {
    if (marked.current) return;
    marked.current = true;
    void fetch("/api/onboarding/mark-qr", { method: "POST" });
  }, []);

  return null;
}

/** @deprecated Legacy localStorage flag — only used for one-time migration. */
export function hasQrOnboardingVisit(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("menuos-onboarding-qr") === "1";
  } catch {
    return false;
  }
}

export function clearQrOnboardingVisitLocal(): void {
  try {
    localStorage.removeItem("menuos-onboarding-qr");
  } catch {
    // private browsing
  }
}
