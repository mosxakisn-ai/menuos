"use client";

import { Lock, LockOpen, Smartphone } from "lucide-react";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { useWaiterShiftLock } from "@/hooks/use-waiter-shift-lock";
import { cn } from "@/lib/utils";

export function WaiterShiftLockControl({ compact = false }: { compact?: boolean }) {
  const { d } = useDashboardCopy();
  const L = d.waiter.shiftLock;
  const { locked, wakeLockSupported, fullscreenActive, busy, toggle } = useWaiterShiftLock();

  if (compact && !locked && wakeLockSupported) {
    return (
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={busy}
        className={cn(
          buttonClass("secondary", "sm"),
          "w-full border-brand-blue/30 text-brand-navy",
        )}
      >
        <Lock className="mr-1.5 h-4 w-4" />
        {L.lockButton}
      </button>
    );
  }

  if (compact && !locked && !wakeLockSupported) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        {L.unsupported}
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", compact ? "" : "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm")}>
      {locked ? (
        <div
          className={cn(
            "flex items-center gap-2 border border-emerald-300 bg-emerald-50",
            compact ? "rounded-lg px-2 py-1" : "rounded-xl px-3 py-2",
          )}
        >
          <Lock className={cn("shrink-0 text-emerald-700", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          <p
            className={cn(
              "min-w-0 flex-1 font-semibold text-emerald-950",
              compact ? "truncate text-xs" : "text-sm",
            )}
          >
            {L.lockedTitle}
          </p>
          {!compact && fullscreenActive ? (
            <p className="hidden text-[11px] text-emerald-800/80 sm:block">{L.fullscreenOn}</p>
          ) : null}
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={busy}
            aria-label={L.unlockButton}
            className={cn(
              buttonClass("secondary", "sm"),
              "shrink-0 border-emerald-400 bg-white text-emerald-900 hover:bg-emerald-100",
              compact && "h-7 px-2",
            )}
          >
            <LockOpen className={cn("shrink-0", compact ? "h-3 w-3" : "mr-1 h-4 w-4")} />
            {compact ? L.unlockButtonShort : L.unlockButton}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-navy">{L.promptTitle}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{L.promptHint}</p>
              {!wakeLockSupported ? (
                <p className="mt-1 text-xs text-amber-800">{L.unsupported}</p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={busy || !wakeLockSupported}
            className={cn(
              buttonClass("primary", "sm"),
              "w-full shrink-0 sm:w-auto",
            )}
          >
            <Lock className="mr-1.5 h-4 w-4" />
            {L.lockButton}
          </button>
        </div>
      )}
    </div>
  );
}
