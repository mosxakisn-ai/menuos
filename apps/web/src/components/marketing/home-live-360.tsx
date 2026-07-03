"use client";

import { Bell, ChefHat, Smartphone, Wine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { SectionHeader } from "@/components/marketing/marketing-blocks";
import { cn } from "@/lib/utils";

const SEGMENT_ICONS: LucideIcon[] = [Smartphone, Bell, ChefHat, Wine];

const SEGMENT_POSITIONS = [
  "top-0 left-1/2 -translate-x-1/2 -translate-y-1",
  "right-0 top-1/2 translate-x-1 -translate-y-1/2",
  "bottom-0 left-1/2 -translate-x-1/2 translate-y-1",
  "left-0 top-1/2 -translate-x-1 -translate-y-1/2",
] as const;

type Live360Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  tagline: string;
  segments: readonly { label: string; hint: string }[];
};

export function HomeLive360({ copy }: { copy: Live360Copy }) {
  return (
    <section className="relative overflow-hidden border-y border-slate-100 bg-gradient-to-b from-white via-brand-surface/60 to-white py-16 sm:py-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(6,182,212,0.08),transparent_60%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_40%,transparent_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <SectionHeader
              eyebrow={copy.eyebrow}
              title={copy.title}
              description={copy.subtitle}
              align="center"
              className="mx-auto max-w-xl lg:mx-0 lg:text-left"
            />
            <p className="mt-6 text-sm font-semibold tracking-wide text-brand-cyan lg:text-base">
              {copy.tagline}
            </p>
            <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-md">
              {copy.segments.map(({ label, hint }) => (
                <li
                  key={label}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-left shadow-soft backdrop-blur-sm"
                >
                  <p className="text-sm font-bold text-brand-navy">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div
              className="relative h-[min(100%,20rem)] w-[min(100%,20rem)] max-h-80 max-w-80 sm:h-80 sm:w-80"
              aria-hidden
            >
              <div className="absolute inset-6 animate-[spin_48s_linear_infinite] rounded-full border border-dashed border-brand-blue/25 motion-reduce:animate-none" />
              <div className="absolute inset-10 rounded-full bg-gradient-to-br from-brand-blue/[0.06] via-transparent to-brand-cyan/[0.08]" />

              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-2xl bg-white p-2 shadow-glow ring-1 ring-brand-blue/10">
                  <LogoMark size={72} />
                </div>
              </div>

              {copy.segments.map(({ label }, index) => {
                const Icon = SEGMENT_ICONS[index] ?? Smartphone;
                return (
                  <div
                    key={label}
                    className={cn(
                      "absolute z-10 flex flex-col items-center gap-1.5",
                      SEGMENT_POSITIONS[index],
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-soft ring-1 ring-transparent transition",
                        "animate-live360-segment motion-reduce:animate-none motion-reduce:opacity-100",
                      )}
                      style={{ animationDelay: `${index * 3}s` }}
                    >
                      <Icon className="h-6 w-6 text-brand-blue" strokeWidth={1.75} aria-hidden />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
