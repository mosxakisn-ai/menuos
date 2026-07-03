"use client";

import { useEffect, useState } from "react";
import { Bell, ChefHat, Smartphone, Wine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { SectionHeader } from "@/components/marketing/marketing-blocks";
import { cn } from "@/lib/utils";

const SEGMENT_ICONS: LucideIcon[] = [Smartphone, Bell, ChefHat, Wine];
const SEGMENT_MS = 2800;

/** Inset from orbit edge — keeps icon tiles inside the visible square on mobile. */
const SEGMENT_POSITIONS = [
  "left-1/2 top-[5%] -translate-x-1/2",
  "right-[5%] top-1/2 -translate-y-1/2",
  "left-1/2 bottom-[5%] -translate-x-1/2",
  "left-[5%] top-1/2 -translate-y-1/2",
] as const;

type Live360Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  tagline: string;
  segments: readonly { label: string; hint: string }[];
};

function SegmentCards({
  copy,
  activeIndex,
  className,
}: {
  copy: Live360Copy;
  activeIndex: number;
  className?: string;
}) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4", className)}>
      {copy.segments.map(({ label, hint }, index) => {
        const isActive = activeIndex === index;
        return (
          <li
            key={label}
            className={cn(
              "rounded-2xl border px-3 py-2.5 text-left shadow-soft backdrop-blur-sm transition-all duration-500 sm:px-4 sm:py-3",
              isActive
                ? "border-brand-cyan/50 bg-gradient-to-br from-brand-blue/[0.08] to-brand-cyan/[0.12] ring-2 ring-brand-cyan/35"
                : "border-slate-200/80 bg-white/70 opacity-55",
            )}
          >
            <p
              className={cn(
                "text-sm font-bold transition-colors duration-500",
                isActive ? "text-brand-navy" : "text-slate-500",
              )}
            >
              {label}
            </p>
            <p className={cn("mt-0.5 text-xs leading-snug", isActive ? "text-slate-600" : "text-slate-400")}>
              {hint}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function OrbitVisual({
  copy,
  activeIndex,
  motionReduced,
}: {
  copy: Live360Copy;
  activeIndex: number;
  motionReduced: boolean;
}) {
  return (
    <div className="flex w-full justify-center overflow-visible px-2 sm:px-0">
      <div
        className="relative aspect-square w-full max-w-[17.5rem] sm:max-w-80 sm:w-80"
        aria-hidden
      >
        <div className="absolute inset-[12%] rounded-full border border-dashed border-brand-blue/35" />
        <div
          className={cn(
            "absolute inset-[12%] rounded-full border-2 border-transparent transition-all duration-700 motion-reduce:transition-none",
            !motionReduced && "animate-[spin_12s_linear_infinite]",
          )}
          style={{
            borderTopColor: "rgba(6, 182, 212, 0.85)",
            borderRightColor: "rgba(37, 99, 235, 0.15)",
            borderBottomColor: "rgba(37, 99, 235, 0.15)",
            borderLeftColor: "rgba(37, 99, 235, 0.15)",
          }}
        />

        <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-brand-blue/[0.07] via-transparent to-brand-cyan/[0.1]" />

        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div
            className={cn(
              "scale-[0.82] rounded-2xl bg-white p-2 shadow-glow ring-2 transition-all duration-500 sm:scale-100",
              activeIndex >= 0 ? "ring-brand-cyan/40" : "ring-brand-blue/10",
            )}
          >
            <LogoMark size={72} />
          </div>
        </div>

        {copy.segments.map(({ label }, index) => {
          const Icon = SEGMENT_ICONS[index % SEGMENT_ICONS.length] ?? Smartphone;
          const isActive = activeIndex === index;
          const position = SEGMENT_POSITIONS[index % SEGMENT_POSITIONS.length];
          return (
            <div key={label} className={cn("absolute z-10 flex flex-col items-center", position)}>
              {isActive && !motionReduced ? (
                <span
                  className="absolute inset-0 -z-10 animate-ping rounded-2xl bg-brand-cyan/40 motion-reduce:animate-none"
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-500 ease-out sm:h-16 sm:w-16",
                  isActive
                    ? "scale-110 border-transparent bg-brand-gradient shadow-[0_0_36px_rgba(6,182,212,0.55)] ring-2 ring-brand-cyan/50"
                    : "scale-[0.88] border-slate-200/90 bg-slate-100 opacity-40",
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors duration-500 sm:h-7 sm:w-7",
                    isActive ? "text-white" : "text-slate-400",
                  )}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HomeLive360({ copy }: { copy: Live360Copy }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [motionReduced, setMotionReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (motionReduced) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % copy.segments.length);
    }, SEGMENT_MS);
    return () => window.clearInterval(id);
  }, [copy.segments.length, motionReduced]);

  return (
    <section className="relative overflow-x-hidden border-y border-slate-100 bg-gradient-to-b from-white via-brand-surface/60 to-white py-14 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(6,182,212,0.08),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_40%,transparent_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <SectionHeader
              eyebrow={copy.eyebrow}
              title={copy.title}
              description={copy.subtitle}
              align="center"
              className="mx-auto max-w-xl lg:mx-0 lg:text-left"
            />
            <p className="mt-5 text-sm font-semibold tracking-wide text-brand-cyan sm:mt-6 lg:text-base">
              {copy.tagline}
            </p>
            <SegmentCards copy={copy} activeIndex={activeIndex} className="mt-8 hidden lg:grid lg:max-w-md" />
          </div>

          <div className="overflow-visible lg:justify-self-end">
            <OrbitVisual copy={copy} activeIndex={activeIndex} motionReduced={motionReduced} />
          </div>

          <SegmentCards
            copy={copy}
            activeIndex={activeIndex}
            className="col-span-full lg:hidden"
          />
        </div>
      </div>
    </section>
  );
}
