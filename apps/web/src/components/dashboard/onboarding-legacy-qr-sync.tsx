"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  clearQrOnboardingVisitLocal,
  hasQrOnboardingVisit,
} from "@/components/dashboard/mark-qr-onboarding";

/** One-time migration: localStorage QR flag → httpOnly session cookie, then remove localStorage. */
export function OnboardingLegacyQrSync({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const synced = useRef(false);

  useEffect(() => {
    if (!enabled || synced.current || !hasQrOnboardingVisit()) return;
    synced.current = true;
    void fetch("/api/onboarding/mark-qr", { method: "POST" }).then((res) => {
      clearQrOnboardingVisitLocal();
      if (res.ok) router.refresh();
    });
  }, [enabled, router]);

  return null;
}
