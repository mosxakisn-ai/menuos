"use client";

import { Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StepCircleState = "pending" | "active" | "done" | "error";

/** Unified step / pipeline circle — onboarding, import, wizards. */
export function DashboardStepCircle({
  state,
  index,
  size = "md",
  className,
}: {
  state: StepCircleState;
  index?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  if (state === "done") {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_0_3px_rgba(16,185,129,0.15)]",
          dim,
          className,
        )}
      >
        <Check className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2.75} />
      </span>
    );
  }

  if (state === "active") {
    return (
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white shadow-glow",
          dim,
          className,
        )}
      >
        {index !== undefined ? (
          index
        ) : (
          <Loader2 className={size === "sm" ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
        )}
        <span className="absolute inset-0 rounded-full ring-2 ring-brand-blue/25 ring-offset-2 ring-offset-white" />
      </span>
    );
  }

  if (state === "error") {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white",
          dim,
          className,
        )}
      >
        !
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white font-semibold text-slate-400",
        dim,
        className,
      )}
    >
      {index !== undefined ? index : null}
    </span>
  );
}

/** Subscription / connection status dot. */
export function DashboardStatusDot({
  active,
  size = "md",
  className,
}: {
  active: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const dim = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        dim,
        active ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" : "bg-red-400 shadow-[0_0_0_2px_rgba(248,113,113,0.2)]",
        className,
      )}
      aria-hidden
    />
  );
}

/** Waiter pending count — sidebar & mobile. */
export function DashboardCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[10px] font-bold leading-none text-amber-950 shadow-sm",
        count >= 10 && "min-w-[22px] text-[9px]",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Feature list checkmark in soft circle — billing, plans. */
export function DashboardFeatureCheck({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue",
        className,
      )}
    >
      <Check className="h-3 w-3" strokeWidth={2.75} />
    </span>
  );
}

/**
 * Horizontal scroll without ugly scrollbars — fade edges only when overflow exists.
 * Prevents phantom scrollbars when content fits.
 */
export function DashboardScrollRow({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const overflow = el.scrollWidth - el.clientWidth > 2;
    if (!overflow) {
      setCanLeft(false);
      setCanRight(false);
      return;
    }
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update, children]);

  return (
    <div className={cn("relative min-w-0", className)}>
      {canLeft ? (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent"
          aria-hidden
        />
      ) : null}
      {canRight ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent"
          aria-hidden
        />
      ) : null}
      <div ref={scrollerRef} className={cn("dashboard-scroll-x min-w-0", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
