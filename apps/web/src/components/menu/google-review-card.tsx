"use client";

import { ArrowRight, Star } from "lucide-react";
import type { QrMenuLanguage } from "@menuos/shared";
import { getQrMenuUi } from "@menuos/shared";
import { cn } from "@/lib/utils";

function formatRatingBadge(value: number | string | { toString(): string }): string {
  const n = typeof value === "number" ? value : parseFloat(value.toString());
  if (!Number.isFinite(n)) return "";
  return n.toFixed(1);
}

function parseRatingValue(
  rating: number | string | { toString(): string } | null | undefined,
): number | null {
  if (rating == null) return null;
  const n = typeof rating === "number" ? rating : parseFloat(rating.toString());
  if (!Number.isFinite(n)) return null;
  return Math.min(5, Math.max(0, n));
}

function RatingStars({ value }: { value: number | null }) {
  const stars = value ?? 5;

  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => {
        const fill = Math.min(1, Math.max(0, stars - index));
        if (fill <= 0) {
          return <Star key={index} className="h-3.5 w-3.5 text-slate-200" />;
        }
        if (fill >= 1) {
          return (
            <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          );
        }
        return (
          <span key={index} className="relative inline-block h-3.5 w-3.5 shrink-0">
            <Star className="absolute inset-0 text-slate-200" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function GoogleReviewCard({
  url,
  lang,
  rating,
  reviewCount,
  className,
}: {
  url: string;
  lang: QrMenuLanguage;
  rating?: number | string | { toString(): string } | null;
  reviewCount?: number | null;
  className?: string;
}) {
  const ui = getQrMenuUi(lang);
  const ratingValue = parseRatingValue(rating);
  const ratingLabel = ratingValue != null ? formatRatingBadge(ratingValue) : null;
  const subtitle =
    reviewCount != null && reviewCount > 0
      ? ui.googleReviewCount(reviewCount)
      : ui.googleReviewsCta;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${ui.googleReviews}${ratingLabel ? `, ${ratingLabel}` : ""} — ${subtitle}`}
      className={cn(
        "flex w-full items-center gap-3.5 overflow-hidden rounded-card border border-slate-100/90 bg-white p-4 shadow-soft transition hover:border-amber-200/70 hover:shadow-card active:scale-[0.99] touch-manipulation",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
          ratingLabel ? "bg-amber-50" : "bg-surface ring-1 ring-slate-100",
        )}
        aria-hidden
      >
        {ratingLabel ? (
          <span className="text-lg font-bold tabular-nums text-amber-500">{ratingLabel}</span>
        ) : (
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
        )}
      </div>

      <div className="min-w-0 flex-1 text-left">
        <RatingStars value={ratingValue} />
        <p className="mt-1.5 font-semibold leading-tight text-primary">{ui.googleReviews}</p>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>

      <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
    </a>
  );
}
