"use client";

import { useEffect, useState } from "react";

const POLL_MS = 5_000;

export function usePendingWaiterCount(initialCount: number) {
  const [pendingCount, setPendingCount] = useState(initialCount);

  useEffect(() => {
    setPendingCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/dashboard/pending-calls", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { pendingCount?: number };
        if (typeof data.pendingCount === "number") {
          setPendingCount(data.pendingCount);
        }
      } catch {
        /* ignore transient network errors */
      }
    }

    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return pendingCount;
}
