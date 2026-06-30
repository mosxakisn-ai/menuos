"use client";

import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { hasQrOnboardingVisit } from "@/components/dashboard/mark-qr-onboarding";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";

export type OnboardingState = {
  hasVenue: boolean;
  hasCategory: boolean;
  hasItem: boolean;
  venueId?: string;
  venueSlug?: string;
  itemCount: number;
};

export function OnboardingWizard({ state }: { state: OnboardingState }) {
  const [qrVisited, setQrVisited] = useState(false);

  useEffect(() => {
    setQrVisited(hasQrOnboardingVisit());
  }, []);

  const steps = [
    {
      id: "venue",
      title: "Δημιούργησε venue",
      desc: "Το κατάστημα ή ξενοδοχείο σου (π.χ. Marine Hotel).",
      done: state.hasVenue,
      href: "/dashboard/venues/new",
      cta: "Προσθήκη venue",
    },
    {
      id: "menu",
      title: "Πρόσθεσε πιάτα",
      desc: state.hasCategory
        ? "Πρόσθεσε πιάτα χειροκίνητα ή κάνε import από PDF (breakfast, pool bar κ.λπ.)."
        : "Κατηγορίες και πιάτα — χειροκίνητα ή import από PDF.",
      done: state.hasItem,
      href: state.venueId ? `/dashboard/menus?venue=${state.venueId}` : "/dashboard/menus",
      cta: "Επεξεργασία menu",
      altHref: state.venueId ? `/dashboard/menus/import?venue=${state.venueId}` : "/dashboard/menus/import",
      altCta: "Import PDF",
    },
    {
      id: "qr",
      title: "Βγάλε QR codes",
      desc: "Κατέβασε QR για τραπέζια και δοκίμασε το live menu.",
      done: qrVisited && state.hasItem,
      href: state.venueId ? `/dashboard/qr?venue=${state.venueId}` : "/dashboard/qr",
      cta: "QR codes",
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed >= 3) return null;

  return (
    <Card className="border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 to-brand-cyan/5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">Οδηγός εκκίνησης</p>
          <h2 className="mt-1 text-lg font-bold text-brand-navy">
            Βήμα {Math.min(completed + 1, 3)} από 3 — φτιάξε το menu σου
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Ακολούθησε τα βήματα για live QR menu σε λιγότερο από μία ώρα.
          </p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-blue shadow-soft">
          {completed}/3 ολοκληρωμένα
        </div>
      </div>

      <ol className="mt-6 space-y-4">
        {steps.map((step, i) => (
          <li key={step.id} className="flex gap-4">
            <div
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                step.done
                  ? "bg-emerald-500 text-white"
                  : i === completed
                    ? "bg-brand-gradient text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {step.done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-brand-navy">{step.title}</p>
              <p className="text-sm text-slate-600">{step.desc}</p>
              {!step.done && i === completed ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={step.href}
                    className={`inline-flex items-center gap-1 text-sm font-semibold ${buttonClass("primary", "sm")}`}
                  >
                    {step.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {"altHref" in step && step.altHref ? (
                    <Link
                      href={step.altHref}
                      className={`inline-flex items-center gap-1 text-sm font-semibold ${buttonClass("secondary", "sm")}`}
                    >
                      {step.altCta}
                    </Link>
                  ) : null}
                </div>
              ) : step.done ? (
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <Check className="h-3 w-3" /> Έτοιμο
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Circle className="h-3 w-3" /> Σε αναμονή
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {state.hasItem && state.venueSlug ? (
        <p className="mt-4 text-sm text-slate-600">
          Το live menu σου:{" "}
          <a
            href={`/m/${state.venueSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-blue hover:underline"
          >
            /m/{state.venueSlug}
          </a>
        </p>
      ) : null}
    </Card>
  );
}
