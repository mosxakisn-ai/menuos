"use client";

import { ArrowRight, Star } from "lucide-react";
import type { QrMenuLanguage } from "@menuos/shared";
import { getQrMenuUi } from "@menuos/shared";
import { cn } from "@/lib/utils";

export function GoogleReviewCard({
  url,
  lang,
  className,
}: {
  url: string;
  lang: QrMenuLanguage;
  className?: string;
}) {
  const ui = getQrMenuUi(lang);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${ui.googleReviews} — ${ui.googleReviewsCta}`}
      className={cn(
        "flex w-full items-center gap-3.5 overflow-hidden rounded-card border border-slate-100/90 bg-white p-4 shadow-soft transition hover:border-amber-200/70 hover:shadow-card active:scale-[0.99] touch-manipulation",
        className,
      )}
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-50"
        aria-hidden
      >
        <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
      </div>

      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="mt-1.5 font-semibold leading-tight text-primary">{ui.googleReviews}</p>
        <p className="mt-0.5 text-xs text-slate-500">{ui.googleReviewsCta}</p>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
    </a>
  );
}
