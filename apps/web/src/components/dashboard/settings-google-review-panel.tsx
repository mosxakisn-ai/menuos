"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeGoogleReviewUrlInput } from "@menuos/shared";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardFormGridClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import type { SettingsVenue } from "@/components/dashboard/settings-form";

type VenueWithGoogle = SettingsVenue & {
  googleReviewUrl?: string | null;
  googleReviewRating?: { toString(): string } | number | null;
  googleReviewCount?: number | null;
};

function ratingToInput(value: VenueWithGoogle["googleReviewRating"]): string {
  if (value == null) return "";
  const n = typeof value === "number" ? value : parseFloat(value.toString());
  return Number.isFinite(n) ? String(n) : "";
}

function countToInput(value: number | null | undefined): string {
  if (value == null) return "";
  return String(value);
}

export function SettingsGoogleReviewPanel({ venues }: { venues: VenueWithGoogle[] }) {
  const { d } = useDashboardCopy();
  const G = d.pages.settings.generalTab.googleReview;
  const router = useRouter();
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(venue?.googleReviewUrl ?? "");
  const [googleReviewRating, setGoogleReviewRating] = useState(ratingToInput(venue?.googleReviewRating));
  const [googleReviewCount, setGoogleReviewCount] = useState(countToInput(venue?.googleReviewCount));
  const [saving, setSaving] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  function applyVenue(v: VenueWithGoogle | undefined) {
    setGoogleReviewUrl(v?.googleReviewUrl ?? "");
    setGoogleReviewRating(ratingToInput(v?.googleReviewRating));
    setGoogleReviewCount(countToInput(v?.googleReviewCount));
  }

  useEffect(() => {
    const v = venues.find((x) => x.id === venueId);
    applyVenue(v);
  }, [venues, venueId]);

  function selectVenue(id: string) {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    applyVenue(v);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;

    const ratingRaw = googleReviewRating.trim();
    const countRaw = googleReviewCount.trim();
    const ratingParsed = ratingRaw ? parseFloat(ratingRaw.replace(",", ".")) : null;
    const countParsed = countRaw ? parseInt(countRaw, 10) : null;

    if (ratingRaw && (!Number.isFinite(ratingParsed) || ratingParsed! < 1 || ratingParsed! > 5)) {
      setFlash({ type: "error", text: d.api.invalidData });
      return;
    }
    if (countRaw && (!Number.isFinite(countParsed) || countParsed! < 0)) {
      setFlash({ type: "error", text: d.api.invalidData });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleReviewUrl: normalizeGoogleReviewUrlInput(googleReviewUrl),
          googleReviewRating: ratingRaw ? Math.round(ratingParsed! * 10) / 10 : null,
          googleReviewCount: countRaw ? countParsed : null,
        }),
      });
      const data = await res.json();
      showFromResponse(data, res.ok, res.status);
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (venues.length === 0) return null;

  return (
    <div className={dashboardCardClass}>
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />
      <h2 className="text-sm font-semibold text-primary">{G.title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{G.description}</p>

      {venues.length > 1 ? (
        <label className="mt-4 block max-w-md">
          <span className={dashboardLabelClass}>{d.venue}</span>
          <select
            value={venueId}
            onChange={(e) => selectVenue(e.target.value)}
            className={`mt-2 ${dashboardFieldClass}`}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <form onSubmit={onSubmit} className={`mt-4 max-w-xl ${dashboardFormGridClass}`}>
        <label className="block sm:col-span-2">
          <span className={dashboardLabelClass}>{G.urlLabel}</span>
          <input
            type="text"
            value={googleReviewUrl}
            onChange={(e) => setGoogleReviewUrl(e.target.value)}
            placeholder={G.urlPlaceholder}
            className={`mt-2 ${dashboardFieldClass}`}
            inputMode="url"
            autoComplete="off"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{G.urlHint}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-600">{G.urlRequiredHint}</p>
        </label>

        <label className="block">
          <span className={dashboardLabelClass}>{G.ratingLabel}</span>
          <input
            type="text"
            inputMode="decimal"
            value={googleReviewRating}
            onChange={(e) => setGoogleReviewRating(e.target.value)}
            placeholder={G.ratingPlaceholder}
            className={`mt-2 ${dashboardFieldClass}`}
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-slate-500">{G.ratingHint}</p>
        </label>

        <label className="block">
          <span className={dashboardLabelClass}>{G.countLabel}</span>
          <input
            type="text"
            inputMode="numeric"
            value={googleReviewCount}
            onChange={(e) => setGoogleReviewCount(e.target.value)}
            placeholder={G.countPlaceholder}
            className={`mt-2 ${dashboardFieldClass}`}
            autoComplete="off"
          />
          <p className="mt-1 text-[11px] text-slate-500">{G.countHint}</p>
        </label>

        <p className="sm:col-span-2 text-[11px] text-slate-400">{G.optionalFieldsHint}</p>

        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className={buttonClass("primary", "md")}>
            {saving ? G.saving : G.save}
          </button>
        </div>
      </form>
    </div>
  );
}
