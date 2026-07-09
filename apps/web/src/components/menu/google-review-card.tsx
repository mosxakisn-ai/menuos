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
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:border-amber-200/80 hover:shadow-md active:scale-[0.99]",
        className,
      )}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50"
        aria-hidden
      >
        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-0.5" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="mt-1 text-sm font-bold text-primary">{ui.googleReviews}</p>
        <p className="text-xs text-slate-500">{ui.googleReviewsCta}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </a>
  );
}
