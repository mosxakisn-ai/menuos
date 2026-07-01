"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { DemoBadge } from "@/components/dashboard/settings-demo-badge";
import { PassSignalHistoryPanel } from "@/components/dashboard/pass-signal-history-panel";
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
  coldScreenToken?: string;
  dessertScreenToken?: string;
};

type ScreenKind = "kitchen" | "bar" | "cold" | "dessert";

const SCREEN_PATHS: Record<ScreenKind, "/kds" | "/bds" | "/cold" | "/dessert"> = {
  kitchen: "/kds",
  bar: "/bds",
  cold: "/cold",
  dessert: "/dessert",
};

const SCREEN_TOKEN_KEYS: Record<ScreenKind, keyof VenueWithScreenTokens> = {
  kitchen: "kitchenScreenToken",
  bar: "barScreenToken",
  cold: "coldScreenToken",
  dessert: "dessertScreenToken",
};

function buildScreenUrl(path: "/kds" | "/bds" | "/cold" | "/dessert", slug: string, token: string) {
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
  tokenOverrides,
  onTokenRotated,
}: {
  kind: ScreenKind;
  venues: VenueWithScreenTokens[];
  tokenOverrides: Record<string, string>;
  onTokenRotated: (venueId: string, kind: ScreenKind, token: string) => void;
}) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
  const copy =
    kind === "kitchen"
      ? S.kitchen
      : kind === "bar"
        ? S.bar
        : kind === "cold"
          ? S.cold
          : S.dessert;
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const venue = venues.find((v) => v.id === venueId);
  const tokenKey = SCREEN_TOKEN_KEYS[kind];
  const overrideKey = venueId ? `${venueId}:${kind}` : "";
  const token =
    (overrideKey ? tokenOverrides[overrideKey] : undefined) ??
    (venue ? (venue[tokenKey] as string | undefined) : undefined);
  const screenUrl =
    venue?.slug && token ? buildScreenUrl(SCREEN_PATHS[kind], venue.slug, token) : "";

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

  async function rotateToken() {
    if (!venueId || !window.confirm(S.rotateScreenConfirm)) return;
    setRotating(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/rotate-screen-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screen: kind }),
      });
      const data = (await res.json()) as { screenToken?: string; error?: string };
      if (!res.ok || !data.screenToken) {
        window.alert(data.error ?? S.rotateScreenFailed);
        return;
      }
      onTokenRotated(venueId, kind, data.screenToken);
    } catch {
      window.alert(S.rotateScreenFailed);
    } finally {
      setRotating(false);
    }
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
        <button
          type="button"
          disabled={!venueId || rotating}
          onClick={() => void rotateToken()}
          className={`inline-flex items-center gap-1 ${buttonClass("secondary", "md")}`}
        >
          <RefreshCw className={`h-4 w-4 ${rotating ? "animate-spin" : ""}`} />
          {rotating ? S.rotatingScreen : S.rotateScreenButton}
        </button>
      </div>
    </div>
  );
}

function StationScreensGroup({
  kinds,
  venues,
}: {
  kinds: ScreenKind[];
  venues: VenueWithScreenTokens[];
}) {
  const [tokenOverrides, setTokenOverrides] = useState<Record<string, string>>({});

  function handleRotated(venueId: string, kind: ScreenKind, token: string) {
    setTokenOverrides((prev) => ({ ...prev, [`${venueId}:${kind}`]: token }));
  }

  return (
    <div className="space-y-5">
      {kinds.map((kind) => (
        <StationScreenPanel
          key={kind}
          kind={kind}
          venues={venues}
          tokenOverrides={tokenOverrides}
          onTokenRotated={handleRotated}
        />
      ))}
    </div>
  );
}

export function SettingsKitchenPanel({ venues }: { venues: VenueWithScreenTokens[] }) {
  return <StationScreensGroup kinds={["kitchen", "cold"]} venues={venues} />;
}

export function SettingsBarPanel({ venues }: { venues: VenueWithScreenTokens[] }) {
  return <StationScreensGroup kinds={["bar", "dessert"]} venues={venues} />;
}

export function SettingsTablesPanel({ venues }: { venues: VenueSpotVenue[] }) {
  return <VenueSpotsSetup venues={venues} />;
}

export function SettingsServicesPanel({
  venues,
}: {
  venues: (Pick<SettingsVenue, "id" | "name" | "slug"> & { staffToken?: string })[];
}) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
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
      </div>

      <PassSignalHistoryPanel venues={venues} />
    </div>
  );
}
