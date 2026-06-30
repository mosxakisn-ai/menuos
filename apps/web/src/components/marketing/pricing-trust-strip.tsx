"use client";

import { CreditCard, Globe, Shield, Sparkles } from "lucide-react";
import { useI18n } from "@/i18n/context";

const icons = [Sparkles, Shield, Globe, CreditCard];

export function PricingTrustStrip() {
  const { m } = useI18n();
  const items = m.pages.pricing.trustItems;

  return (
    <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((label, i) => {
        const Icon = icons[i] ?? Sparkles;
        return (
          <div
            key={label}
            className="flex items-center gap-3 rounded-card border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-soft"
          >
            <Icon className="h-5 w-5 shrink-0 text-brand-blue" aria-hidden />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
