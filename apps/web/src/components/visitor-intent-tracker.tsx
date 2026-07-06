"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  resolveVisitorIntentFromPath,
  startVisitorIntentHeartbeat,
  stopVisitorIntentHeartbeat,
} from "@/lib/visitor-intent-client";

/** Tracks anonymous visitors on marketing, register, and billing funnel pages. */
export function VisitorIntentTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const ctx = resolveVisitorIntentFromPath(pathname);
    if (!ctx) {
      stopVisitorIntentHeartbeat();
      return;
    }
    startVisitorIntentHeartbeat(ctx);
    return () => stopVisitorIntentHeartbeat();
  }, [pathname]);

  return null;
}
