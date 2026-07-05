"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, MapPin } from "lucide-react";
import {
  applyZoneLabelOverrides,
  groupVenueSpotsByZone,
  zoneSourceHint,
  type SpotZoneGroup,
} from "@menuos/shared";
import { useVenueOperationsConfig } from "@/components/dashboard/venue-operations-config-panel";
import { useVenueSpots } from "@/components/dashboard/use-venue-spots";
import { WaiterShareLink } from "@/components/dashboard/waiter-share-link";
import { dashboardCardClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buildStaffShareUrl } from "@/lib/staff-share-url";

type Venue = { id: string; name: string; slug: string; staffToken?: string };

function SpaceStaffLinkCard({
  venueId,
  zone,
  staffUrl,
  langCode,
  copy,
}: {
  venueId: string;
  zone: SpotZoneGroup;
  staffUrl: string;
  langCode: "GR" | "EN";
  copy: {
    spotCount: (n: number) => string;
    openLink: string;
    copyLink: string;
    copied: string;
    downloadQr: string;
    loadingQr: string;
  };
}) {
  const [pngDataUrl, setPngDataUrl] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadQr = useCallback(async () => {
    setLoadingQr(true);
    try {
      const params = new URLSearchParams({ venueId, zone: zone.id });
      const res = await fetch(`/api/staff-qr?${params.toString()}`);
      const data = (await res.json()) as { pngDataUrl?: string };
      setPngDataUrl(res.ok ? (data.pngDataUrl ?? "") : "");
    } finally {
      setLoadingQr(false);
    }
  }, [venueId, zone.id]);

  useEffect(() => {
    void loadQr();
  }, [loadQr]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(staffUrl);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    if (!pngDataUrl) return;
    const a = document.createElement("a");
    a.href = pngDataUrl;
    a.download = `menuos-${zone.id.replace(/[^a-z0-9]+/gi, "-")}.png`;
    a.click();
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
          <MapPin className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-brand-navy">{zone.label}</h3>
          <p className="mt-1 text-sm text-slate-600">{zoneSourceHint(zone, langCode)}</p>
          <p className="mt-1 text-xs text-slate-500">{copy.spotCount(zone.spots.length)}</p>
        </div>
        {pngDataUrl ? (
          <img
            src={pngDataUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-lg border border-slate-100 bg-white p-1"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
            {loadingQr ? copy.loadingQr : "QR"}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={staffUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 ${buttonClass("primary", "sm")}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {copy.openLink}
        </a>
        <button
          type="button"
          onClick={() => void copyLink()}
          className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? copy.copied : copy.copyLink}
        </button>
        <button
          type="button"
          disabled={!pngDataUrl}
          onClick={downloadQr}
          className={`inline-flex items-center gap-1.5 ${buttonClass("secondary", "sm")}`}
        >
          <Download className="h-3.5 w-3.5" />
          {copy.downloadQr}
        </button>
      </div>
    </article>
  );
}

export function SpaceStaffLinksPanel({ venues }: { venues: Venue[] }) {
  const { d, lang } = useDashboardCopy();
  const L = d.pages.settings.linksTab;
  const langCode = lang === "EN" ? "EN" : "GR";
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [staffTokens, setStaffTokens] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const venue of venues) {
      if (venue.staffToken) map[venue.id] = venue.staffToken;
    }
    return map;
  });

  const { spots, loading: spotsLoading } = useVenueSpots(venueId);
  const { config: opsConfig, loading: configLoading } = useVenueOperationsConfig(venueId);

  useEffect(() => {
    if (venues.length && !venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

  const zoneGroups = useMemo(() => {
    const groups = groupVenueSpotsByZone(spots);
    return applyZoneLabelOverrides(groups, opsConfig?.zoneLabels);
  }, [spots, opsConfig?.zoneLabels]);

  const venue = venues.find((v) => v.id === venueId);
  const staffToken = venue ? staffTokens[venue.id] : undefined;
  const loading = spotsLoading || configLoading;

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="text-sm text-slate-600">{d.pages.qr.needVenueDesc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {venues.length > 1 ? (
        <label className={`${dashboardCardClass} block max-w-md`}>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {d.venue}
          </span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="mt-1.5 w-full rounded-button border border-slate-200 px-3 py-2 text-sm"
          >
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {venue && staffToken ? (
        <WaiterShareLink
          venueSlug={venue.slug}
          staffToken={staffToken}
          venueId={venue.id}
          onStaffTokenRotated={(next) =>
            setStaffTokens((prev) => ({ ...prev, [venue.id]: next }))
          }
        />
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">{L.loading}</p>
      ) : zoneGroups.length === 0 ? (
        <div className={dashboardCardClass}>
          <p className="text-sm text-slate-600">{L.empty}</p>
          <a
            href="/dashboard/settings?tab=spaces"
            className="mt-3 inline-block text-sm font-semibold text-brand-blue hover:underline"
          >
            {L.spacesTabLink}
          </a>
        </div>
      ) : !staffToken ? (
        <div className={dashboardCardClass}>
          <p className="text-sm text-slate-600">{L.noStaffToken}</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {zoneGroups.map((zone) => (
            <SpaceStaffLinkCard
              key={zone.id}
              venueId={venueId}
              zone={zone}
              staffUrl={buildStaffShareUrl(venue!.slug, staffToken, zone.id)}
              langCode={langCode}
              copy={{
                spotCount: L.spotCount,
                openLink: L.openLink,
                copyLink: L.copyLink,
                copied: d.waiter.copied,
                downloadQr: L.downloadQr,
                loadingQr: L.loadingQr,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
