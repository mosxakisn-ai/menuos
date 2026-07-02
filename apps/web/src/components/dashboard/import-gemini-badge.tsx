"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImportGeminiBadge({
  label,
  className,
  pulse = true,
}: {
  label: string;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-blue/[0.12] via-white to-cyan-400/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-brand-navy ring-1 ring-brand-blue/20",
        className,
      )}
    >
      <Sparkles className={cn("h-3.5 w-3.5 text-brand-blue", pulse && "animate-pulse")} aria-hidden />
      {label}
    </span>
  );
}
