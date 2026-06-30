"use client";

import { Quote } from "lucide-react";
import { useI18n } from "@/i18n/context";

export function MarketingTestimonials() {
  const { m } = useI18n();
  const t = m.marketing.home.testimonials;

  return (
    <section className="border-b border-slate-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">
          {t.eyebrow}
        </p>
        <h2 className="mt-3 text-center text-3xl font-extrabold tracking-tight text-brand-navy sm:text-4xl">
          {t.title}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {t.items.map((item) => (
            <blockquote
              key={item.name}
              className="flex h-full flex-col rounded-card border border-slate-200/80 bg-brand-surface/40 p-6 shadow-soft"
            >
              <Quote className="h-8 w-8 text-brand-cyan/60" aria-hidden />
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-6 border-t border-slate-200/80 pt-4">
                <p className="font-bold text-brand-navy">{item.name}</p>
                <p className="text-xs text-slate-500">{item.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">{t.disclaimer}</p>
      </div>
    </section>
  );
}
