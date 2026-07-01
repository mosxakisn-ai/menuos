"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { PassSignalHistoryPanel } from "@/components/dashboard/pass-signal-history-panel";
import { StationScreensPanel } from "@/components/dashboard/station-screens-panel";
import { VenueSpotsSetup } from "@/components/dashboard/venue-spots-setup";
import { VenueStaffSetup } from "@/components/dashboard/venue-staff-setup";
import { WaiterShareLink } from "@/components/dashboard/waiter-share-link";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import type { SettingsVenue } from "@/components/dashboard/settings-form";

type VenueSpotVenue = { id: string; name: string; slug: string };

export function SettingsPersonnelPanel({ venues }: { venues: VenueSpotVenue[] }) {
  return <VenueStaffSetup venues={venues} />;
}

export function SettingsKitchenPanel({ venues }: { venues: VenueSpotVenue[] }) {
  return (
    <div className="space-y-5">
      <StationScreensPanel station="kitchen" venues={venues} />
      <StationScreensPanel station="cold" venues={venues} />
    </div>
  );
}

export function SettingsBarPanel({ venues }: { venues: VenueSpotVenue[] }) {
  return (
    <div className="space-y-5">
      <StationScreensPanel station="bar" venues={venues} />
      <StationScreensPanel station="dessert" venues={venues} />
    </div>
  );
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
