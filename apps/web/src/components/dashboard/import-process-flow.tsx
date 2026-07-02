"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type FlowLabels = {
  scan: string;
  analyze: string;
  report: string;
  review: string;
};

const STEP_KEYS = ["scan", "analyze", "report", "review"] as const;

export function ImportProcessFlow({ labels }: { labels: FlowLabels }) {
  return (
    <div className="relative mt-1 overflow-x-auto pb-0.5">
      <div
        className="pointer-events-none absolute left-4 right-4 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-brand-blue/0 via-brand-blue/25 to-brand-blue/0 sm:block"
        aria-hidden
      />
      <ol className="relative flex min-w-max items-center gap-0 sm:min-w-0 sm:w-full sm:justify-between">
        {STEP_KEYS.map((key, index) => {
          const isLast = index === STEP_KEYS.length - 1;
          return (
            <li key={key} className="flex items-center sm:flex-1 sm:justify-center">
              <span
                className={cn(
                  "relative z-[1] whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold tracking-wide sm:px-4 sm:text-sm",
                  "bg-white text-brand-navy shadow-sm ring-1 ring-brand-blue/15",
                )}
              >
                {labels[key]}
              </span>
              {!isLast ? (
                <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-brand-blue/40 sm:hidden" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
