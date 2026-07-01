"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardStepCircle } from "@/components/dashboard/dashboard-ui";
import { hasQrOnboardingVisit } from "@/components/dashboard/mark-qr-onboarding";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { cn } from "@/lib/utils";

export type OnboardingState = {
  hasVenue: boolean;
  hasCategory: boolean;
  hasItem: boolean;
  venueId?: string;
  venueSlug?: string;
  itemCount: number;
};

export function OnboardingWizard({ state }: { state: OnboardingState }) {
  const { d } = useDashboardCopy();
  const O = d.onboarding;
  const [qrVisited, setQrVisited] = useState(false);

  useEffect(() => {
    setQrVisited(hasQrOnboardingVisit());
  }, []);

  const steps = [
    {
      id: "venue",
      title: O.steps.venue.title,
      desc: O.steps.venue.desc,
      done: state.hasVenue,
      href: "/dashboard/venues/new",
      cta: d.addVenue,
    },
    {
      id: "menu",
      title: O.steps.menu.title,
      desc: state.hasCategory ? O.steps.menu.descWithCategory : O.steps.menu.descWithoutCategory,
      done: state.hasItem,
      href: state.venueId ? `/dashboard/menus?venue=${state.venueId}` : "/dashboard/menus",
      cta: d.editCatalog,
      altHref: state.venueId ? `/dashboard/menus/import?venue=${state.venueId}` : "/dashboard/menus/import",
      altCta: d.importPdf,
    },
    {
      id: "qr",
      title: O.steps.qr.title,
      desc: O.steps.qr.desc,
      done: qrVisited && state.hasItem,
      href: state.venueId ? `/dashboard/qr?venue=${state.venueId}` : "/dashboard/qr",
      cta: d.qrCodes,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed >= 3) return null;

  const activeIndex = Math.min(completed, 2);

  return (
    <Card className="overflow-hidden border-brand-blue/15 bg-gradient-to-br from-brand-blue/[0.04] via-white to-brand-cyan/[0.05] shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">{O.guideLabel}</p>
          <h2 className="mt-1 font-serif text-xl font-bold text-brand-navy sm:text-2xl">
            {O.stepTitle(Math.min(completed + 1, 3))}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{O.subtitle}</p>
        </div>
        <div className="rounded-full border border-brand-blue/15 bg-white px-3 py-1.5 text-xs font-semibold text-brand-blue shadow-sm">
          {O.completed(completed)}
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {steps.map((step, i) => {
          const isActive = !step.done && i === activeIndex;
          const circleState = step.done ? "done" : isActive ? "active" : "pending";
          return (
            <li
              key={step.id}
              className={cn(
                "flex gap-4 rounded-card border px-4 py-3.5 transition-colors",
                step.done && "border-emerald-100 bg-emerald-50/40",
                isActive && "border-brand-blue/20 bg-white shadow-soft",
                !step.done && !isActive && "border-slate-100 bg-white/60",
              )}
            >
              <DashboardStepCircle state={circleState} index={i + 1} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-brand-navy">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                {!step.done && isActive ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={step.href}
                      className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
                    >
                      {step.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    {"altHref" in step && step.altHref ? (
                      <Link href={step.altHref} className={buttonClass("secondary", "sm")}>
                        {step.altCta}
                      </Link>
                    ) : null}
                  </div>
                ) : step.done ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3 w-3" /> {O.done}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">{O.pending}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {state.hasItem && state.venueSlug ? (
        <p className="mt-4 text-sm text-slate-600">
          {O.previewIntro}{" "}
          <a
            href={`/m/${state.venueSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-blue hover:underline"
          >
            {O.openCatalog}
          </a>
        </p>
      ) : null}
    </Card>
  );
}
