"use client";

import { FileText, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

function formatElapsed(seconds: number, labels: { seconds: (n: number) => string; minutes: (m: number, s: number) => string }): string {
  if (seconds < 60) return labels.seconds(seconds);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return labels.minutes(m, s);
}

function ImportProcessingVisual({ poweredByGemini }: { poweredByGemini: boolean }) {
  return (
    <div className="relative mx-auto flex h-36 w-full max-w-xs items-center justify-center sm:h-40">
      <div
        className="pointer-events-none absolute inset-0 rounded-[2rem] bg-brand-gradient opacity-[0.12] blur-2xl animate-shimmer"
        aria-hidden
      />
      <div className="relative w-[7.5rem] sm:w-[8.5rem]">
        <div className="relative overflow-hidden rounded-2xl border border-brand-blue/20 bg-white shadow-[0_20px_50px_-20px_rgba(37,99,235,0.45)] ring-1 ring-brand-blue/10">
          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/90 px-2.5 py-2">
            <span className="h-2 w-2 rounded-full bg-red-300/80" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-amber-300/80" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-emerald-300/80" aria-hidden />
            <FileText className="ml-auto h-3.5 w-3.5 text-brand-blue/70" aria-hidden />
          </div>
          <div className="relative space-y-1.5 overflow-hidden bg-gradient-to-b from-white to-slate-50/80 p-3">
            {[0.9, 0.75, 0.6, 0.45].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-slate-200/90"
                style={{ width: `${w * 100}%`, animationDelay: `${i * 0.15}s` }}
                aria-hidden
              />
            ))}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              <div className="animate-scan-line-band absolute inset-0 will-change-transform">
                <div className="h-8 w-full bg-gradient-to-b from-brand-cyan/25 via-brand-blue/10 to-transparent" />
              </div>
              <div className="animate-scan-line absolute inset-0 will-change-transform">
                <div className="h-0.5 w-full rounded-full bg-brand-cyan shadow-[0_0_12px_#06B6D4]" />
              </div>
            </div>
          </div>
        </div>
        {poweredByGemini ? (
          <span className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient shadow-glow animate-float">
            <Sparkles className="h-4 w-4 text-white" aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function ImportPipelineProgress({
  steps,
  progress,
  title,
  subtitle,
  poweredByGemini = false,
  startedAt,
  activityMap,
  timerLabels,
  timerHint,
  longWaitHint,
  longWaitAfterSec = 90,
  targetLabel,
}: {
  steps: PipelineStep[];
  progress?: number;
  title: string;
  subtitle?: string;
  poweredByGemini?: boolean;
  startedAt?: number;
  activityMap?: Record<string, readonly string[]>;
  timerLabels?: { seconds: (n: number) => string; minutes: (m: number, s: number) => string };
  timerHint?: string;
  longWaitHint?: string;
  longWaitAfterSec?: number;
  /** Which catalog receives the import (e.g. «cavo»). */
  targetLabel?: string;
}) {
  const activeStep = steps.find((s) => s.status === "active");
  const activities = useMemo(() => {
    if (!activeStep || !activityMap) return [];
    const key =
      activeStep.id === "extract" && poweredByGemini ? "extractGemini" : activeStep.id;
    return activityMap[key] ?? activityMap[activeStep.id] ?? [];
  }, [activeStep, activityMap, poweredByGemini]);

  const [activityIndex, setActivityIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    setActivityIndex(0);
  }, [activeStep?.id]);

  useEffect(() => {
    if (activities.length <= 1) return;
    const id = window.setInterval(() => {
      setActivityIndex((i) => (i + 1) % activities.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [activities]);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSec(0);
      return;
    }
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const liveActivity =
    activeStep?.detail ??
    (activities.length > 0 ? activities[activityIndex] : undefined);

  return (
    <div className="space-y-5 px-2 py-2 sm:px-4">
      <ImportProcessingVisual poweredByGemini={poweredByGemini} />

      <div className="text-center">
        {poweredByGemini ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-blue/[0.08] px-3 py-1 ring-1 ring-brand-blue/15">
            <Sparkles className="h-4 w-4 animate-pulse text-brand-blue" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">Gemini AI</span>
          </div>
        ) : null}
        <p className="font-serif text-lg font-bold text-brand-navy sm:text-xl">{title}</p>
        {targetLabel ? (
          <p className="mx-auto mt-2 inline-flex max-w-md items-center justify-center rounded-full bg-brand-blue/[0.08] px-4 py-1.5 text-sm font-semibold text-brand-navy ring-1 ring-brand-blue/15">
            {targetLabel}
          </p>
        ) : null}
        {subtitle ? <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p> : null}

        {liveActivity ? (
          <div
            key={liveActivity}
            className="mx-auto mt-4 max-w-md transition-opacity duration-500"
          >
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-blue/[0.06] px-3 py-1.5 text-xs font-semibold text-brand-navy ring-1 ring-brand-blue/10">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue" />
              </span>
              {liveActivity}
            </p>
          </div>
        ) : null}

        {startedAt && timerLabels ? (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="tabular-nums">
              <span className="font-medium text-brand-navy">{formatElapsed(elapsedSec, timerLabels)}</span>
            </span>
            {timerHint ? <span className="text-slate-400">· {timerHint}</span> : null}
          </div>
        ) : null}
        {longWaitHint && elapsedSec >= longWaitAfterSec ? (
          <p className="mx-auto mt-3 max-w-md rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800 ring-1 ring-amber-200/80">
            {longWaitHint}
          </p>
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
          <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="relative h-full rounded-full bg-brand-gradient transition-all duration-700 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
            <div
              className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/40 to-transparent"
              aria-hidden
            />
          </div>
          <div className="flex items-center justify-between px-0.5 text-xs font-semibold tabular-nums text-brand-blue">
            <span>{Math.round(progress)}%</span>
            {startedAt && timerLabels ? (
              <span className="text-slate-400">{formatElapsed(elapsedSec, timerLabels)}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
