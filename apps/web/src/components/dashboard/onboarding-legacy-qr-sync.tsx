"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { hasQrOnboardingVisit } from "@/components/dashboard/mark-qr-onboarding";

/** Migrates legacy localStorage QR flag to httpOnly cookie. */
export function OnboardingLegacyQrSync({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const synced = useRef(false);

  useEffect(() => {
    if (!enabled || synced.current || !hasQrOnboardingVisit()) return;
    synced.current = true;
    void fetch("/api/onboarding/mark-qr", { method: "POST" }).then(() => {
      router.refresh();
    });
  }, [enabled, router]);

  return null;
}
