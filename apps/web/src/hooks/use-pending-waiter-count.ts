"use client";

import { useEffect, useState } from "react";

const POLL_MS = 5_000;

/** Sidebar badge: pending waiter calls + active pass signals. */
export function usePendingWaiterCount(initialCount: number, enabled = true) {
  const [activeCount, setActiveCount] = useState(initialCount);

  useEffect(() => {
    setActiveCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/dashboard/pending-calls", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { activeCount?: number };
        if (typeof data.activeCount === "number") {
          setActiveCount(data.activeCount);
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
  }, [enabled]);

  return enabled ? activeCount : 0;
}
