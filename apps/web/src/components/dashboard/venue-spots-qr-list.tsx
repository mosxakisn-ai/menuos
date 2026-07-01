"use client";

import { Download, ExternalLink, QrCode } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
type Spot = { id: string; type: string; label: string };
type QrData = { pngDataUrl: string; menuUrl: string };

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

  useEffect(() => {
    setQrExpandedId(null);
    setQrCache({});
    qrCacheRef.current = {};
  }, [venueId]);

  const [busy, setBusy] = useState<string | null>(null);
  const [qrExpandedId, setQrExpandedId] = useState<string | null>(null);
  const [qrCache, setQrCache] = useState<Record<string, QrData>>({});
  const qrCacheRef = useRef<Record<string, QrData>>({});
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const venue = venues.find((v) => v.id === venueId);
  const itemCount = itemCountByVenue[venueId] ?? 0;

  function menuPathFor(spot: Spot): string {
    if (!venue) return "#";
    const params = new URLSearchParams();
    const q = spotToQueryParams(spot.type as "TABLE" | "ROOM" | "SUNBED", spot.label);
    if (q.table) params.set("table", q.table);
    if (q.room) params.set("room", q.room);
    if (q.sunbed) params.set("sunbed", q.sunbed);
    const qs = params.toString();
    return `/m/${venue.slug}${qs ? `?${qs}` : ""}`;
  }

  function qrParamsFor(spot: Spot): URLSearchParams {
    const params = new URLSearchParams({ venueId });
    const q = spotToQueryParams(spot.type as "TABLE" | "ROOM" | "SUNBED", spot.label);
    if (q.table) params.set("table", q.table);
    if (q.room) params.set("room", q.room);
    if (q.sunbed) params.set("sunbed", q.sunbed);
    return params;
  }

  async function fetchQr(spot: Spot): Promise<QrData | null> {
    const cached = qrCacheRef.current[spot.id];
    if (cached) return cached;
    if (!venueId) return null;
    const res = await fetch(`/api/qr?${qrParamsFor(spot)}`);
    const data = (await res.json()) as { pngDataUrl?: string; menuUrl?: string; error?: string };
    if (!res.ok || !data.pngDataUrl || !data.menuUrl) {
      showFromResponse(data, false);
      return null;
    }
    const qr: QrData = { pngDataUrl: data.pngDataUrl, menuUrl: data.menuUrl };
    qrCacheRef.current = { ...qrCacheRef.current, [spot.id]: qr };
    setQrCache(qrCacheRef.current);
    return qr;
  }

  async function toggleQrPreview(spot: Spot) {
    if (qrExpandedId === spot.id) {
      setQrExpandedId(null);
      return;
    }
    if (qrCache[spot.id]) {
      setQrExpandedId(spot.id);
      return;
    }
    setBusy(`view-${spot.id}`);
    try {
      const qr = await fetchQr(spot);
      if (qr) setQrExpandedId(spot.id);
    } finally {
      setBusy(null);
    }
  }

  async function downloadQr(spot: Spot) {
    setBusy(`qr-${spot.id}`);
    try {
      const qr = await fetchQr(spot);
      if (!qr) return;
      const a = document.createElement("a");
      a.href = qr.pngDataUrl;
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
            {spots.map((spot) => {
              const expanded = qrExpandedId === spot.id;
              const qr = qrCache[spot.id];
              const viewBusy = busy === `view-${spot.id}`;

              return (
                <li
                  key={spot.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/40 px-4 py-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-brand-navy">
                        {formatVenueSpotLabelForLang(spot.type, spot.label, lang)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{menuPathFor(spot)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={busy !== null && !viewBusy}
                        onClick={() => void toggleQrPreview(spot)}
                        className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
                        aria-expanded={expanded}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        {viewBusy ? Q.loadingQr : expanded ? Q.hideQr : Q.showQr}
                      </button>
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
                  </div>

                  {expanded ? (
                    <div className="mt-4 flex flex-col items-center border-t border-slate-200/80 pt-4">
                      {viewBusy && !qr ? (
                        <p className="text-sm text-slate-500">{Q.loadingQr}</p>
                      ) : qr ? (
                        <>
                          <img
                            src={qr.pngDataUrl}
                            alt={formatVenueSpotLabelForLang(spot.type, spot.label, lang)}
                            className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
                          />
                          <p className="mt-2 max-w-full truncate text-xs text-slate-500">{qr.menuUrl}</p>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
