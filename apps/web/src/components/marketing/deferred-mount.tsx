"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Mount children when near the viewport — keeps below-fold dynamic imports off the critical path. */
export function DeferredMount({
  children,
  fallback = null,
  rootMargin = "240px",
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (typeof IntersectionObserver === "undefined") {
      setReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReady(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return <div ref={hostRef}>{ready ? children : fallback}</div>;
}
