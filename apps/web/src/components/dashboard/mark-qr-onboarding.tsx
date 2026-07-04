"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function MarkQrOnboarding({ redirectToDashboard = false }: { redirectToDashboard?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/onboarding/mark-qr", { method: "POST" }).then((res) => {
      if (redirectToDashboard && res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }, [redirectToDashboard, router]);

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
