"use client";

import { useEffect } from "react";

const QR_ONBOARDING_KEY = "menuos-onboarding-qr";

export function MarkQrOnboarding() {
  useEffect(() => {
    try {
      localStorage.setItem(QR_ONBOARDING_KEY, "1");
    } catch {
      // private browsing
    }
  }, []);
  return null;
}

export function hasQrOnboardingVisit(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(QR_ONBOARDING_KEY) === "1";
  } catch {
    return false;
  }
}
