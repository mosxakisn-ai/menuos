"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { DemoBadge } from "@/components/dashboard/settings-demo-badge";
import { TableGridPreview } from "@/components/dashboard/table-grid-preview";
import { VenueSpotsSetup } from "@/components/dashboard/venue-spots-setup";
import { WaiterShareLink } from "@/components/dashboard/waiter-share-link";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { buttonClass } from "@/components/ui/button";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { getSettingsDemo } from "@/content/settings-demo";
import { clientShareOrigin } from "@/lib/client-share-origin";
import type { SettingsVenue } from "@/components/dashboard/settings-form";

type VenueSpotVenue = { id: string; name: string; slug: string };
type VenueWithScreenTokens = VenueSpotVenue & {
  kitchenScreenToken?: string;
  barScreenToken?: string;
};

function buildScreenUrl(path: "/kds" | "/bds", slug: string, token: string) {
  const u = new URL(path, clientShareOrigin());
  u.searchParams.set("venueSlug", slug);
  u.searchParams.set("key", token);
  return u.toString();
}

export function SettingsPersonnelPanel() {
  const { d, lang } = useDashboardCopy();
  const S = d.pages.settings;
  const demo = getSettingsDemo(lang);

  return (
    <div className="space-y-5">
      <div className={dashboardCardClass}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-primary">{S.personnel.title}</h2>
          <DemoBadge>{S.demoBadge}</DemoBadge>
        </div>
        <p className="mt-2 text-sm text-slate-600">{S.personnel.description}</p>
        <button type="button" disabled className={`mt-4 ${buttonClass("secondary", "md")}`}>
          {S.personnel.addStaff}
        </button>
      </div>

      <div className={dashboardCardClass}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="pb-3 pr-4 font-medium">{S.personnel.colName}</th>
                <th className="pb-3 pr-4 font-medium">{S.personnel.colRole}</th>
                <th className="pb-3 font-medium">{S.personnel.colStations}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {demo.staff.map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4 font-medium text-brand-navy">{row.name}</td>
                  <td className="py-3 pr-4 text-slate-700">{row.role}</td>
                  <td className="py-3 text-slate-600">{row.stations.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StationScreenPanel({
  kind,
  venues,
}: {
  kind: "kitchen" | "bar";
  venues: VenueWithScreenTokens[];
}) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
  const copy = kind === "kitchen" ? S.kitchen : S.bar;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const venue = venues.find((v) => v.id === venueId);
  const token =
    kind === "kitchen" ? venue?.kitchenScreenToken : venue?.barScreenToken;
  const screenUrl = venue?.slug && token ? buildScreenUrl(kind === "kitchen" ? "/kds" : "/bds", venue.slug, token) : "";

  useEffect(() => {
    if (venues.length && !venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

  async function copyLink() {
    if (!screenUrl) return;
    try {
      await navigator.clipboard.writeText(screenUrl);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (venues.length === 0) {
    return (
      <div className={dashboardCardClass}>
        <p className="text-sm text-slate-600">{d.pages.qr.needVenueDesc}</p>
      </div>
    );
  }

  return (
    <div className={dashboardCardClass}>
      <h2 className="text-sm font-semibold text-primary">{copy.title}</h2>
      <p className="mt-2 text-sm text-slate-600">{copy.description}</p>

      {venues.length > 1 ? (
        <label className="mt-4 block max-w-md">
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
      ) : null}

      <p className="mt-4 text-sm font-semibold text-brand-navy">{copy.screenLink}</p>
      <p className="mt-1 text-xs text-slate-500">{copy.screenHint}</p>
      <code className="mt-2 block break-all rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
        {screenUrl || "…"}
      </code>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={screenUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!screenUrl}
          className={`inline-flex items-center gap-1 ${buttonClass("primary", "md")} ${!screenUrl ? "pointer-events-none opacity-50" : ""}`}
        >
          <ExternalLink className="h-4 w-4" />
          {copy.openScreen}
        </a>
        <button
          type="button"
          disabled={!screenUrl}
          onClick={() => void copyLink()}
          className={`inline-flex items-center gap-1 ${buttonClass("secondary", "md")}`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? d.waiter.copied : copy.copyScreenLink}
        </button>
      </div>
    </div>
  );
}

export function SettingsKitchenPanel({ venues }: { venues: VenueWithScreenTokens[] }) {
  return <StationScreenPanel kind="kitchen" venues={venues} />;
}

export function SettingsBarPanel({ venues }: { venues: VenueWithScreenTokens[] }) {
  return <StationScreenPanel kind="bar" venues={venues} />;
}

export function SettingsTablesPanel({ venues }: { venues: VenueSpotVenue[] }) {
  return <VenueSpotsSetup venues={venues} />;
}

export function SettingsServicesPanel({
  venues,
}: {
  venues: (Pick<SettingsVenue, "id" | "name" | "slug"> & { staffToken?: string })[];
}) {
  const { d, lang } = useDashboardCopy();
  const S = d.pages.settings;
  const demo = getSettingsDemo(lang);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const venue = venues.find((v) => v.id === venueId);

  useEffect(() => {
    if (venues.length === 0) {
      setVenueId("");
      return;
    }
    if (!venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

  return (
    <div className="space-y-5">
      {venue?.staffToken ? (
        <div className={dashboardCardClass}>
          <h2 className="text-sm font-semibold text-primary">{d.waiter.shareTitle}</h2>
          {venues.length > 1 ? (
            <label className="mt-4 block max-w-md">
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
          ) : null}
          <div className="mt-4">
            <WaiterShareLink
              venueSlug={venue.slug}
              staffToken={venue.staffToken}
              venueId={venue.id}
            />
          </div>
        </div>
      ) : null}

      <div className={dashboardCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">{S.services.passTitle}</h2>
          <a
            href="/dashboard/waiter"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
          >
            {S.services.livePanelLink}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mt-2 text-sm text-slate-600">{S.services.passHint}</p>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {S.tables.gridPreview}
            </p>
            <DemoBadge>{S.demoBadge}</DemoBadge>
          </div>
          <TableGridPreview tiles={demo.tableTiles} stateLabels={demo.tableStateLabels} />
        </div>
      </div>
    </div>
  );
}
