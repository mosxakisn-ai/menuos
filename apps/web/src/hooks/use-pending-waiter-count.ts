"use client";

import { useEffect, useState } from "react";

const POLL_MS = 5_000;

/** Sidebar badge: pending waiter calls only. */
export function usePendingWaiterCount(initialCount: number, enabled = true) {
  const [pendingCount, setPendingCount] = useState(initialCount);

  useEffect(() => {
    setPendingCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch("/api/dashboard/pending-calls", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { pendingCount?: number; activeCount?: number };
        const next =
          typeof data.pendingCount === "number"
            ? data.pendingCount
            : typeof data.activeCount === "number"
              ? data.activeCount
              : null;
        if (next !== null) setPendingCount(next);
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

  return enabled ? pendingCount : 0;
}
