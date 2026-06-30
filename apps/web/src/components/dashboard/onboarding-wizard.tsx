"use client";

import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { hasQrOnboardingVisit } from "@/components/dashboard/mark-qr-onboarding";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { DASHBOARD_EL } from "@/content/dashboard-el";

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
      title: "Φτιάξε το κατάστημά σου",
      desc: "Το εστιατόριο, το bar ή το ξενοδοχείο σου — π.χ. «Marine Hotel» ή «Ταβέρνα του Γιώργου».",
      done: state.hasVenue,
      href: "/dashboard/venues/new",
      cta: DASHBOARD_EL.addVenue,
    },
    {
      id: "menu",
      title: "Βάλε πιάτα στον κατάλογο",
      desc: state.hasCategory
        ? "Πρόσθεσε πιάτα χειροκίνητα ή κάνε εισαγωγή από PDF αν έχεις Pro."
        : "Φτιάξε κατηγορίες (Σαλάτες, Κυρίως πιάτα...) και βάλε τιμές και φωτογραφίες.",
      done: state.hasItem,
      href: state.venueId ? `/dashboard/menus?venue=${state.venueId}` : "/dashboard/menus",
      cta: DASHBOARD_EL.editCatalog,
      altHref: state.venueId ? `/dashboard/menus/import?venue=${state.venueId}` : "/dashboard/menus/import",
      altCta: DASHBOARD_EL.importPdf,
    },
    {
      id: "qr",
      title: "Βγάλε QR για τα τραπέζια",
      desc: "Κατέβασε QR codes, τύπωσέ τα ή βάλτα σε stand. Οι πελάτες σκανάρουν και βλέπουν τον κατάλογο.",
      done: qrVisited && state.hasItem,
      href: state.venueId ? `/dashboard/qr?venue=${state.venueId}` : "/dashboard/qr",
      cta: DASHBOARD_EL.qrCodes,
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
            Σε λιγότερο από μία ώρα μπορείς να έχεις QR menu στα τραπέζια σου.
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
          Δες πώς φαίνεται στους πελάτες:{" "}
          <a
            href={`/m/${state.venueSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-blue hover:underline"
          >
            Άνοιγμα καταλόγου
          </a>
        </p>
      ) : null}
    </Card>
  );
}
