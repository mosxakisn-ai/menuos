"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  resolveVisitorIntentFromPath,
  startVisitorIntentHeartbeat,
  stopVisitorIntentHeartbeat,
} from "@/lib/visitor-intent-client";

/** Tracks anonymous visitors on marketing, register, and billing funnel pages. */
export function VisitorIntentTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    const ctx = resolveVisitorIntentFromPath(pathname, search ? `?${search}` : "");
    if (!ctx) {
      stopVisitorIntentHeartbeat({ endSession: true });
      return;
    }
    startVisitorIntentHeartbeat(ctx);
    return () => stopVisitorIntentHeartbeat({ endSession: false });
  }, [pathname, search]);

  return null;
}
