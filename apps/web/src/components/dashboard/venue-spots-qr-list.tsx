"use client";

import { ChevronDown, Download, ExternalLink, MapPin, QrCode } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyZoneLabelOverrides,
  formatVenueSpotLabelForLang,
  groupVenueSpotsByZone,
  spotToQueryParams,
  zoneSourceHint,
  type SpotZoneGroup,
  type VenueSpotType,
} from "@menuos/shared";
import { FlashMessages, useFlashMessage } from "@/components/dashboard/flash-message";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import {
  DashboardSectionTitle,
  dashboardCardClass,
  dashboardFieldClass,
  dashboardLabelClass,
} from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

type Venue = { id: string; name: string; slug: string };
type Spot = { id: string; type: VenueSpotType; label: string };
type QrData = { pngDataUrl: string; menuUrl: string };

function SpotQrRow({
  spot,
  venueSlug,
  lang,
  copy,
  busy,
  expanded,
  qr,
  onTogglePreview,
  onDownload,
}: {
  spot: Spot;
  venueSlug: string;
  lang: string;
  copy: {
    showQr: string;
    hideQr: string;
    loadingQr: string;
    previewSpot: string;
  };
  busy: string | null;
  expanded: boolean;
  qr?: QrData;
  onTogglePreview: () => void;
  onDownload: () => void;
}) {
  const langCode = lang === "EN" ? "EN" : "GR";
  const spotLabel = formatVenueSpotLabelForLang(spot.type, spot.label, langCode);
  const viewBusy = busy === `view-${spot.id}`;

  function menuPath(): string {
    const params = new URLSearchParams();
    const q = spotToQueryParams(spot.type, spot.label);
    if (q.table) params.set("table", q.table);
    if (q.room) params.set("room", q.room);
    if (q.sunbed) params.set("sunbed", q.sunbed);
    const qs = params.toString();
    return `/m/${venueSlug}${qs ? `?${qs}` : ""}`;
  }

  return (
    <li className="rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-brand-navy">{spotLabel}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{menuPath()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy !== null && busy !== `view-${spot.id}` && busy !== `qr-${spot.id}`}
            onClick={onTogglePreview}
            className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
            aria-expanded={expanded}
          >
            <QrCode className="h-3.5 w-3.5" />
            {viewBusy ? copy.loadingQr : expanded ? copy.hideQr : copy.showQr}
          </button>
          <button
            type="button"
            disabled={busy !== null && busy !== `qr-${spot.id}`}
            onClick={onDownload}
            className={`inline-flex items-center gap-1 ${buttonClass("primary", "sm")}`}
          >
            <Download className="h-3.5 w-3.5" />
            QR
          </button>
          <a
            href={menuPath()}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 ${buttonClass("secondary", "sm")}`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {copy.previewSpot}
          </a>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 flex flex-col items-center border-t border-slate-200/80 pt-4">
          {viewBusy && !qr ? (
            <p className="text-sm text-slate-500">{copy.loadingQr}</p>
          ) : qr ? (
            <>
              <img
                src={qr.pngDataUrl}
                alt={spotLabel}
                className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
              />
              <p className="mt-2 max-w-full truncate text-xs text-slate-500">{qr.menuUrl}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function ZoneQrAccordion({
  zone,
  displayName,
  spotByKey,
  expanded,
  onToggle,
  venue,
  lang,
  copy,
  rowCopy,
  busy,
  qrExpandedId,
  qrCache,
  onTogglePreview,
  onDownload,
}: {
  zone: SpotZoneGroup;
  displayName: string;
  spotByKey: Map<string, Spot>;
  expanded: boolean;
  onToggle: () => void;
  venue: Venue;
  lang: string;
  copy: { spotCount: (n: number) => string; sourceHint: string };
  rowCopy: {
    showQr: string;
    hideQr: string;
    loadingQr: string;
    previewSpot: string;
  };
  busy: string | null;
  qrExpandedId: string | null;
  qrCache: Record<string, QrData>;
  onTogglePreview: (spot: Spot) => void;
  onDownload: (spot: Spot) => void;
}) {
  const zoneSpots = zone.spots
    .map((entry) => spotByKey.get(`${entry.spot.type}:${entry.spot.label}`))
    .filter((spot): spot is Spot => Boolean(spot));

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100/80 transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-gradient-to-r hover:from-brand-blue/[0.04] hover:to-cyan-400/[0.05]"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/15 to-cyan-400/20 text-brand-blue">
          <MapPin className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-brand-navy">{displayName}</h3>
            <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-semibold text-brand-blue">
              {copy.spotCount(zoneSpots.length)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">{copy.sourceHint}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {expanded ? (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4">
          <ul className="space-y-3">
            {zoneSpots.map((spot) => (
              <SpotQrRow
                key={spot.id}
                spot={spot}
                venueSlug={venue.slug}
                lang={lang}
                copy={rowCopy}
                busy={busy}
                expanded={qrExpandedId === spot.id}
                qr={qrCache[spot.id]}
                onTogglePreview={() => onTogglePreview(spot)}
                onDownload={() => onDownload(spot)}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

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
  const T = d.pages.settings.tablesTab;
  const langCode = lang === "EN" ? "EN" : "GR";

  const [venueId, setVenueId] = useState(initialVenueId ?? venues[0]?.id ?? "");
  const { spots, loading } = useVenueSpots(venueId);
  const { config: opsConfig, loading: configLoading } = useVenueOperationsConfig(venueId);

  const [busy, setBusy] = useState<string | null>(null);
  const [qrExpandedId, setQrExpandedId] = useState<string | null>(null);
  const [qrCache, setQrCache] = useState<Record<string, QrData>>({});
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});
  const qrCacheRef = useRef<Record<string, QrData>>({});
  const venueGenerationRef = useRef(0);
  const { flash, setFlash, showFromResponse } = useFlashMessage();

  useEffect(() => {
    if (initialVenueId && venues.some((v) => v.id === initialVenueId)) {
      setVenueId(initialVenueId);
    }
  }, [initialVenueId, venues]);

  useEffect(() => {
    venueGenerationRef.current += 1;
    setQrExpandedId(null);
    setQrCache({});
    qrCacheRef.current = {};
    setExpandedZones({});
  }, [venueId, spots]);

  const venue = venues.find((v) => v.id === venueId);
  const itemCount = itemCountByVenue[venueId] ?? 0;

  const zoneGroups = useMemo(() => {
    const groups = groupVenueSpotsByZone(spots);
    return applyZoneLabelOverrides(groups, opsConfig?.zoneLabels);
  }, [spots, opsConfig?.zoneLabels]);

  const spotByKey = useMemo(() => {
    const map = new Map<string, Spot>();
    for (const spot of spots) {
      map.set(`${spot.type}:${spot.label}`, spot);
    }
    return map;
  }, [spots]);

  function zoneDisplayName(zone: SpotZoneGroup): string {
    return opsConfig?.zoneLabels?.[zone.id]?.trim() || zone.label;
  }

  function toggleZone(zoneId: string) {
    setExpandedZones((prev) => ({ ...prev, [zoneId]: !prev[zoneId] }));
  }

  function qrParamsFor(spot: Spot): URLSearchParams {
    const params = new URLSearchParams({ venueId });
    const q = spotToQueryParams(spot.type, spot.label);
    if (q.table) params.set("table", q.table);
    if (q.room) params.set("room", q.room);
    if (q.sunbed) params.set("sunbed", q.sunbed);
    return params;
  }

  function qrCacheKey(spot: Spot): string {
    return spot.id;
  }

  async function fetchQr(spot: Spot): Promise<QrData | null> {
    const key = qrCacheKey(spot);
    const cached = qrCacheRef.current[key];
    if (cached) return cached;
    if (!venueId) return null;
    const generation = venueGenerationRef.current;
    const res = await fetch(`/api/qr?${qrParamsFor(spot)}`);
    const data = (await res.json()) as { pngDataUrl?: string; menuUrl?: string; error?: string };
    if (generation !== venueGenerationRef.current) return null;
    if (!res.ok || !data.pngDataUrl || !data.menuUrl) {
      showFromResponse(data, false, res.status);
      return null;
    }
    const qr: QrData = { pngDataUrl: data.pngDataUrl, menuUrl: data.menuUrl };
    qrCacheRef.current = { ...qrCacheRef.current, [key]: qr };
    setQrCache(qrCacheRef.current);
    return qr;
  }

  async function toggleQrPreview(spot: Spot) {
    const key = qrCacheKey(spot);
    if (qrExpandedId === spot.id) {
      setQrExpandedId(null);
      return;
    }
    if (qrCacheRef.current[key]) {
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

  const rowCopy = {
    showQr: Q.showQr,
    hideQr: Q.hideQr,
    loadingQr: Q.loadingQr,
    previewSpot: Q.previewSpot,
  };

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
        <DashboardSectionTitle title={Q.spotsTitle} description={Q.zonesDesc} />

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

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="font-semibold text-brand-navy">{T.listTitle}</h2>
          <p className="mt-1 text-sm text-slate-600">{Q.zonesDesc}</p>
        </div>

        {loading || configLoading ? (
          <p className="mt-4 text-sm text-slate-500">{Q.loadingSpots}</p>
        ) : zoneGroups.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-600">
            {Q.configureSpotsEmpty}{" "}
            <a href="/dashboard/settings?tab=tables" className="font-semibold text-brand-blue hover:underline">
              {Q.configureSpotsLink}
            </a>
          </p>
        ) : (
          <>
            {zoneGroups.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    for (const z of zoneGroups) all[z.id] = true;
                    setExpandedZones(all);
                  }}
                  className={buttonClass("secondary", "sm")}
                >
                  {T.expandAll}
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedZones({})}
                  className={buttonClass("secondary", "sm")}
                >
                  {T.collapseAll}
                </button>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {zoneGroups.map((zone) => (
                <ZoneQrAccordion
                  key={zone.id}
                  zone={zone}
                  displayName={zoneDisplayName(zone)}
                  spotByKey={spotByKey}
                  expanded={Boolean(expandedZones[zone.id])}
                  onToggle={() => toggleZone(zone.id)}
                  venue={venue!}
                  lang={lang}
                  copy={{
                    spotCount: T.spotCount,
                    sourceHint: zoneSourceHint(zone, langCode),
                  }}
                  rowCopy={rowCopy}
                  busy={busy}
                  qrExpandedId={qrExpandedId}
                  qrCache={qrCache}
                  onTogglePreview={(spot) => void toggleQrPreview(spot)}
                  onDownload={(spot) => void downloadQr(spot)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
