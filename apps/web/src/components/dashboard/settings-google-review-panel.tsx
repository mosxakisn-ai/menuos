"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeGoogleReviewUrlInput } from "@menuos/shared";
import {
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import type { SettingsVenue } from "@/components/dashboard/settings-form";

type VenueWithGoogle = SettingsVenue & { googleReviewUrl?: string | null };

export function SettingsGoogleReviewPanel({ venues }: { venues: VenueWithGoogle[] }) {
  const { d } = useDashboardCopy();
  const G = d.pages.settings.generalTab.googleReview;
  const router = useRouter();
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(venue?.googleReviewUrl ?? "");
  const [saving, setSaving] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  useEffect(() => {
    const v = venues.find((x) => x.id === venueId);
    setGoogleReviewUrl(v?.googleReviewUrl ?? "");
  }, [venues, venueId]);

  function selectVenue(id: string) {
    setVenueId(id);
    const v = venues.find((x) => x.id === id);
    setGoogleReviewUrl(v?.googleReviewUrl ?? "");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!venueId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/venues/${venueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleReviewUrl: normalizeGoogleReviewUrlInput(googleReviewUrl),
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

      <form onSubmit={onSubmit} className="mt-4 max-w-xl space-y-3">
        <label className="block">
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
          <p className="mt-1 text-[11px] text-slate-400">{G.clearedHint}</p>
        </label>
        <button type="submit" disabled={saving} className={buttonClass("primary", "md")}>
          {saving ? G.saving : G.save}
        </button>
      </form>
    </div>
  );
}
