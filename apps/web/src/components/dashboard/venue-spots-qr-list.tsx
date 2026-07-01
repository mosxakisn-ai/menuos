"use client";

import { Download, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { formatVenueSpotLabelForLang, spotToQueryParams } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import {
  DashboardSectionTitle,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

type Venue = { id: string; name: string; slug: string };

export function VenueSpotsQrList({
  venues,
  initialVenueId,
  itemCountByVenue = {},
}: {
  venues: Venue[];
  initialVenueId?: string;
  itemCountByVenue?: Record<string, number>;
}) {
  const { d, lang } = useDashboardCopy();
  const Q = d.pages.qr;
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const { spots, loading } = useVenueSpots(venueId);

  useEffect(() => {
    if (initialVenueId && venues.some((v) => v.id === initialVenueId)) {
      setVenueId(initialVenueId);
    }
  }, [initialVenueId, venues]);
  const [busy, setBusy] = useState<string | null>(null);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const venue = venues.find((v) => v.id === venueId);
  const itemCount = itemCountByVenue[venueId] ?? 0;

  function menuPathFor(spot: { type: string; label: string }): string {
    if (!venue) return "#";
    const params = new URLSearchParams();
    const q = spotToQueryParams(spot.type as "TABLE" | "ROOM" | "SUNBED", spot.label);
    if (q.table) params.set("table", q.table);
    if (q.room) params.set("room", q.room);
    if (q.sunbed) params.set("sunbed", q.sunbed);
    const qs = params.toString();
    return `/m/${venue.slug}${qs ? `?${qs}` : ""}`;
  }

  async function downloadQr(spot: { id: string; type: string; label: string }) {
    if (!venueId) return;
    setBusy(`qr-${spot.id}`);
    try {
      const params = new URLSearchParams({ venueId });
      const q = spotToQueryParams(spot.type as "TABLE" | "ROOM" | "SUNBED", spot.label);
      if (q.table) params.set("table", q.table);
      if (q.room) params.set("room", q.room);
      if (q.sunbed) params.set("sunbed", q.sunbed);
      const res = await fetch(`/api/qr?${params}`);
      const data = await res.json();
      if (!res.ok) {
        showFromResponse(data, false);
        return;
      }
      const a = document.createElement("a");
      a.href = data.pngDataUrl;
      a.download = `menuos-${spot.type.toLowerCase()}-${spot.label}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="font-semibold text-brand-navy">{Q.needVenueTitle}</p>
        <p className="mt-2 text-sm text-slate-600">{Q.needVenueDesc}</p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {d.addVenue}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FlashMessages initial={flash} onClear={() => setFlash(null)} />

      {itemCount === 0 ? (
        <div
          role="alert"
          className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-semibold">{Q.emptyCatalogTitle}</p>
          <p className="mt-1">
            {Q.emptyCatalogBeforeLink}{" "}
            <a href={`/dashboard/menus?venue=${venueId}`} className="font-semibold underline">
              {Q.catalogLink}
            </a>{" "}
            {Q.emptyCatalogAfterLink}
          </p>
        </div>
      ) : null}

      <div className={dashboardCardClass}>
        <DashboardSectionTitle title={Q.spotsTitle} description={Q.description} />

        <label className="mt-6 block max-w-md">
          <span className={dashboardLabelClass}>{d.venue}</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className={dashboardFieldClass}
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          <h2 className="font-semibold text-brand-navy">{Q.yourSpots(spots.length)}</h2>
          <a
            href="/dashboard/settings?tab=tables"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            {Q.configureSpotsLink}
          </a>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">{Q.loadingSpots}</p>
        ) : spots.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-600">
            {Q.configureSpotsEmpty}{" "}
            <a href="/dashboard/settings?tab=tables" className="font-semibold text-brand-blue hover:underline">
              {Q.configureSpotsLink}
            </a>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {spots.map((spot) => (
              <li
                key={spot.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-navy">
                    {formatVenueSpotLabelForLang(spot.type, spot.label, lang)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{menuPathFor(spot)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void downloadQr(spot)}
                    className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    QR
                  </button>
                  <a
                    href={menuPathFor(spot)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {Q.previewSpot}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
