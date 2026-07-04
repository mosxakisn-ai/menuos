"use client";

import { Download, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import {
  DashboardSectionTitle,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

type Venue = { id: string; name: string; slug: string };

/** Basic / Trial: one catalog link and QR — no tables, waiter calls, or Live 360°. */
export function VenueCatalogQr({
  venues,
  initialVenueId,
  itemCountByVenue = {},
}: {
  venues: Venue[];
  initialVenueId?: string;
  itemCountByVenue?: Record<string, number>;
}) {
  const { d } = useDashboardCopy();
  const Q = d.pages.qr;
  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const [menuUrl, setMenuUrl] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const venue = venues.find((v) => v.id === venueId);
  const itemCount = itemCountByVenue[venueId] ?? 0;

  const generate = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/qr?${new URLSearchParams({ venueId })}`);
      const data = await res.json();
      if (res.ok) {
        setMenuUrl(data.menuUrl);
        setPngDataUrl(data.pngDataUrl);
      } else {
        setMenuUrl("");
        setPngDataUrl("");
        showFromResponse(data, false, res.status);
      }
    } finally {
      setLoading(false);
    }
  }, [venueId, showFromResponse]);

  useEffect(() => {
    if (initialVenueId && venues.some((v) => v.id === initialVenueId)) {
      setVenueId(initialVenueId);
    }
  }, [initialVenueId, venues]);

  useEffect(() => {
    if (venueId && itemCount > 0) void generate();
  }, [venueId, itemCount, generate]);

  function downloadPng() {
    if (!pngDataUrl || !venue) return;
    const a = document.createElement("a");
    a.href = pngDataUrl;
    a.download = `menuos-${venue.slug}.png`;
    a.click();
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
            {Q.emptyCatalogAfterLinkCustomers}
          </p>
        </div>
      ) : null}

      <div className={dashboardCardClass}>
        <DashboardSectionTitle title={Q.catalogTitle} description={Q.catalogDesc} />

        {venues.length > 1 ? (
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
        ) : venue ? (
          <p className="mt-4 text-sm text-slate-600">
            <span className="font-medium text-brand-navy">{d.venue}:</span> {venue.name}
          </p>
        ) : null}

        {itemCount > 0 ? (
          <div className="mt-6 border-t border-slate-100 pt-6">
            {loading && !pngDataUrl ? (
              <p className="text-sm text-slate-500">{Q.generating}</p>
            ) : pngDataUrl ? (
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-8">
                <img
                  src={pngDataUrl}
                  alt={Q.catalogTitle}
                  className="h-48 w-48 shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                />
                <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                  <p className="text-sm font-semibold text-brand-navy">{Q.catalogLinkLabel}</p>
                  <p className="mt-2 break-all text-sm text-slate-600">{menuUrl}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={downloadPng}
                      className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")}`}
                    >
                      <Download className="h-4 w-4" />
                      {Q.downloadPng}
                    </button>
                    <a
                      href={menuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
                    >
                      {Q.openCatalog}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
