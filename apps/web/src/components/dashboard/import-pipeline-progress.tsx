"use client";

import { Sparkles } from "lucide-react";
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
  subtitle,
  poweredByGemini = false,
}: {
  steps: PipelineStep[];
  progress?: number;
  title: string;
  subtitle?: string;
  poweredByGemini?: boolean;
}) {
  const activeStep = steps.find((s) => s.status === "active");

  return (
    <div className="space-y-6 px-2 py-2 sm:px-4">
      <div className="text-center">
        {poweredByGemini ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-blue/[0.08] px-3 py-1 ring-1 ring-brand-blue/15">
            <Sparkles className="h-4 w-4 animate-pulse text-brand-blue" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">Gemini AI</span>
          </div>
        ) : null}
        <p className="font-serif text-lg font-bold text-brand-navy sm:text-xl">{title}</p>
        {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}
        {activeStep?.detail ? (
          <p className="mt-2 text-xs font-medium text-brand-blue">{activeStep.detail}</p>
        ) : null}
      </div>

      <ol className="mx-auto max-w-lg space-y-2.5">
        {steps.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 rounded-card border px-4 py-3 transition-all duration-500",
              step.status === "active" &&
                "border-brand-blue/30 bg-gradient-to-r from-brand-blue/[0.06] to-cyan-400/[0.04] shadow-soft",
              step.status === "done" && "border-emerald-100 bg-emerald-50/60",
              step.status === "error" && "border-red-200 bg-red-50/80",
              step.status === "pending" && "border-slate-100 bg-white/80 opacity-60",
            )}
          >
            <DashboardStepCircle
              state={toCircleState(step.status)}
              index={step.status === "active" ? undefined : i + 1}
              size="sm"
              className={cn("mt-0.5", step.status === "active" && "animate-pulse")}
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
              {step.detail && step.status !== "active" ? (
                <p className="mt-0.5 text-xs text-slate-500">{step.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {progress !== undefined ? (
        <div className="mx-auto w-full max-w-lg space-y-2">
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="relative h-full rounded-full bg-brand-gradient transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
            <div
              className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent"
              aria-hidden
            />
          </div>
          <p className="text-center text-xs font-semibold tabular-nums text-brand-blue">{Math.round(progress)}%</p>
        </div>
      ) : null}
    </div>
  );
}
