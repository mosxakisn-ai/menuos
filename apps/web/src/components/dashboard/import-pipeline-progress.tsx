"use client";

import { cn } from "@/lib/utils";
import { DashboardStepCircle, type StepCircleState } from "@/components/dashboard/dashboard-ui";

export type PipelineStepStatus = "pending" | "active" | "done" | "error";

export type PipelineStep = {
  id: string;
  label: string;
  status: PipelineStepStatus;
  detail?: string;
};

function toCircleState(status: PipelineStepStatus): StepCircleState {
  return status;
}

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
      <p className="text-center font-serif text-lg font-bold text-brand-navy">{title}</p>

      <ol className="mx-auto max-w-md space-y-2.5">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 rounded-card border px-4 py-3 transition-all duration-300",
              step.status === "active" && "border-brand-blue/25 bg-brand-blue/[0.04] shadow-soft",
              step.status === "done" && "border-emerald-100 bg-emerald-50/50",
              step.status === "error" && "border-red-200 bg-red-50/80",
              step.status === "pending" && "border-slate-100 bg-white/80 opacity-70",
            )}
          >
            <DashboardStepCircle
              state={toCircleState(step.status)}
              index={step.status === "active" ? undefined : i + 1}
              size="sm"
              className="mt-0.5"
            />
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
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-gradient transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-center text-xs font-semibold tabular-nums text-brand-blue">
            {Math.round(progress)}%
          </p>
        </div>
      ) : null}
    </div>
  );
}
