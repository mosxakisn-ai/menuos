"use client";

import { Download, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { QR_MENU_LANGUAGE_LABELS, type QrMenuLanguage } from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { FORM_PLACEHOLDERS } from "@/content/form-placeholders";

type Venue = { id: string; name: string; slug: string };

export function QrGenerator({
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
  const [table, setTable] = useState("");
  const [room, setRoom] = useState("");
  const [lang, setLang] = useState<QrMenuLanguage>("GR");
  const [menuUrl, setMenuUrl] = useState("");
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  const generate = useCallback(async () => {
    if (!venueId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ venueId });
      if (table) params.set("table", table);
      if (room) params.set("room", room);
      if (lang !== "GR") params.set("lang", lang.toLowerCase());
      const res = await fetch(`/api/qr?${params}`);
      const data = await res.json();
      if (res.ok) {
        setMenuUrl(data.menuUrl);
        setPngDataUrl(data.pngDataUrl);
        setFlash({ type: "success", text: Q.generatedSuccess });
      } else {
        showFromResponse(data, false);
      }
    } finally {
      setLoading(false);
    }
  }, [venueId, table, room, lang, showFromResponse, setFlash, Q.generatedSuccess]);

  useEffect(() => {
    if (venueId) void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate when venueId changes only
  }, [venueId]);

  function downloadPng() {
    if (!pngDataUrl) return;
    const a = document.createElement("a");
    a.href = pngDataUrl;
    a.download = `menuos-qr-${table || room || "general"}.png`;
    a.click();
  }

  const itemCount = itemCountByVenue[venueId] ?? 0;

  if (venues.length === 0) {
    return (
      <Card>
        <p className="font-semibold text-brand-navy">{Q.needVenueTitle}</p>
        <p className="mt-2 text-sm text-slate-600">{Q.needVenueDesc}</p>
        <a href="/dashboard/venues/new" className={`mt-4 inline-flex ${buttonClass("primary")}`}>
          {d.addVenue}
        </a>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <h2 className="font-semibold text-brand-navy">{Q.settingsTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{Q.settingsDesc}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium">{d.venue}</span>
            <select
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">{Q.tableLabel}</span>
            <input
              value={table}
              onChange={(e) => setTable(e.target.value)}
              placeholder={FORM_PLACEHOLDERS.qrTable}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">{Q.roomLabel}</span>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder={FORM_PLACEHOLDERS.qrRoom}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">{Q.defaultLangLabel}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as QrMenuLanguage)}
              className="mt-1 w-full rounded-button border border-slate-200 px-3 py-2.5"
            >
              {(Object.keys(QR_MENU_LANGUAGE_LABELS) as QrMenuLanguage[]).map((code) => (
                <option key={code} value={code}>
                  {QR_MENU_LANGUAGE_LABELS[code].name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className={`mt-4 ${buttonClass("primary")}`}
        >
          {loading ? Q.generating : Q.updateQr}
        </button>
      </Card>

      {pngDataUrl ? (
        <Card className="text-center">
          <img src={pngDataUrl} alt="QR code menu" className="mx-auto h-64 w-64 rounded-lg shadow-card" />
          <p className="mt-4 break-all text-xs text-slate-500">{menuUrl}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={downloadPng} className={`inline-flex items-center gap-1 ${buttonClass("primary")}`}>
              <Download className="h-4 w-4" />
              {Q.downloadPng}
            </button>
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 ${buttonClass("secondary")}`}
            >
              {Q.openCatalog}
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
