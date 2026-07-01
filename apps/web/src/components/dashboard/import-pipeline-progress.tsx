"use client";

import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PipelineStepStatus = "pending" | "active" | "done" | "error";

export type PipelineStep = {
  id: string;
  label: string;
  status: PipelineStepStatus;
  detail?: string;
};

export function ImportPipelineProgress({
  steps,
  progress,
  title,
}: {
  steps: PipelineStep[];
  progress?: number;
  title: string;
}) {
  return (
    <div className="space-y-6">
      <p className="text-center text-base font-semibold text-brand-navy">{title}</p>

      <ol className="mx-auto max-w-md space-y-3">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 rounded-card border px-4 py-3 transition-all duration-300",
              step.status === "active" && "border-brand-blue/30 bg-brand-blue/5 shadow-soft",
              step.status === "done" && "border-emerald-200 bg-emerald-50/60",
              step.status === "error" && "border-red-200 bg-red-50",
              step.status === "pending" && "border-slate-100 bg-white opacity-60",
            )}
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
              {step.status === "done" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : step.status === "active" ? (
                <Loader2 className="h-5 w-5 animate-spin text-brand-blue" />
              ) : step.status === "error" ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  !
                </span>
              ) : (
                <Circle className="h-5 w-5 text-slate-300" />
              )}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p
                className={cn(
                  "text-sm font-semibold",
                  step.status === "active" && "text-brand-navy",
                  step.status === "done" && "text-emerald-900",
                  step.status === "error" && "text-red-900",
                  step.status === "pending" && "text-slate-500",
                )}
              >
                {step.label}
              </p>
              {step.detail ? (
                <p className="mt-0.5 truncate text-xs text-slate-500">{step.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {progress !== undefined ? (
        <div className="mx-auto w-full max-w-md space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-center text-xs font-medium text-brand-blue">{Math.round(progress)}%</p>
        </div>
      ) : null}
    </div>
  );
}
