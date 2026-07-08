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
          buttonClass({ variant: "outline", size: "sm" }),
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
        <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Lock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-emerald-950">{L.lockedTitle}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-emerald-900/90">{L.lockedHint}</p>
            {fullscreenActive ? (
              <p className="mt-1 text-[11px] text-emerald-800/80">{L.fullscreenOn}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void toggle()}
            disabled={busy}
            className={cn(
              buttonClass({ variant: "outline", size: "sm" }),
              "shrink-0 border-emerald-400 bg-white text-emerald-900 hover:bg-emerald-100",
            )}
          >
            <LockOpen className="mr-1.5 h-4 w-4" />
            {L.unlockButton}
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
              buttonClass({ variant: "primary", size: "sm" }),
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
