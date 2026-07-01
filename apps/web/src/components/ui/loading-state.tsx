"use client";

import { FileSearch, FileUp, Layers, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type LoadingVariant = "default" | "scan" | "parse" | "import" | "catalog";

type LoadingStateProps = {
  title: string;
  subtitle?: string;
  /** 0–100; omit for indeterminate */
  progress?: number;
  variant?: LoadingVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const ICONS: Record<LoadingVariant, typeof Loader2> = {
  default: Loader2,
  scan: FileSearch,
  parse: Sparkles,
  import: FileUp,
  catalog: Layers,
};

export function LoadingState({
  title,
  subtitle,
  progress,
  variant = "default",
  size = "md",
  className,
}: LoadingStateProps) {
  const Icon = ICONS[variant];
  const isIndeterminate = progress === undefined;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "gap-2 py-4",
        size === "md" && "gap-3 py-8",
        size === "lg" && "gap-4 py-12",
        className,
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-brand-blue/20 blur-xl animate-shimmer",
            size === "sm" ? "scale-110" : "scale-125",
          )}
          aria-hidden
        />
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl bg-brand-gradient shadow-glow",
            size === "sm" && "h-12 w-12",
            size === "md" && "h-16 w-16",
            size === "lg" && "h-20 w-20",
          )}
        >
          {variant === "default" ? (
            <Loader2
              className={cn("animate-spin text-white", size === "sm" ? "h-5 w-5" : size === "md" ? "h-7 w-7" : "h-9 w-9")}
            />
          ) : (
            <>
              <Icon
                className={cn(
                  "text-white animate-float",
                  size === "sm" ? "h-5 w-5" : size === "md" ? "h-7 w-7" : "h-9 w-9",
                )}
              />
              {(variant === "scan" || variant === "parse") && (
                <span
                  className="pointer-events-none absolute inset-x-2 top-0 h-0.5 rounded-full bg-white/70 animate-scan-line"
                  aria-hidden
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="max-w-sm space-y-1">
        <p
          className={cn(
            "font-semibold text-brand-navy",
            size === "sm" ? "text-sm" : "text-base",
          )}
        >
          {title}
        </p>
        {subtitle ? (
          <p className={cn("text-slate-500", size === "sm" ? "text-xs" : "text-sm")}>{subtitle}</p>
        ) : null}
      </div>

      {!isIndeterminate ? (
        <div className="w-full max-w-xs space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs font-medium text-brand-blue">{Math.round(progress!)}%</p>
        </div>
      ) : (
        <div className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-shimmer"
              style={{ animationDelay: `${i * 0.35}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Skeleton blocks for catalog / list loading */
export function LoadingSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-card border border-slate-100 bg-white p-4 shadow-card"
          style={{ animationDelay: `${i * 0.12}s` }}
        >
          <div className="h-5 w-1/3 rounded-md bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-shimmer" />
          <div className="mt-4 space-y-2">
            <div className="h-10 rounded-lg bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 bg-[length:200%_100%] animate-shimmer" />
            <div className="h-10 w-5/6 rounded-lg bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 bg-[length:200%_100%] animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
