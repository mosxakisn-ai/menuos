"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { StationScreensPanel } from "@/components/dashboard/station-screens-panel";
import { VenueSpotsSetup } from "@/components/dashboard/venue-spots-setup";
import { VenueStaffSetup } from "@/components/dashboard/venue-staff-setup";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import type { SettingsVenue } from "@/components/dashboard/settings-form";

type VenueSpotVenue = { id: string; name: string; slug: string };

function useVenuePicker(venues: VenueSpotVenue[]) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");

  useEffect(() => {
    if (venues.length === 0) {
      setVenueId("");
      return;
    }
    if (!venues.some((v) => v.id === venueId)) {
      setVenueId(venues[0]!.id);
    }
  }, [venues, venueId]);

  return { venueId, setVenueId };
}

function DepartmentTabIntro({
  title,
  description,
  hint,
  venues,
  venueId,
  onVenueChange,
}: {
  title: string;
  description: string;
  hint: string;
  venues: VenueSpotVenue[];
  venueId: string;
  onVenueChange: (id: string) => void;
}) {
  const { d } = useDashboardCopy();

  return (
    <div className={dashboardCardClass}>
      <h2 className="text-base font-semibold text-brand-navy">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">
        {hint.split("\n").map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {venues.length > 1 ? (
        <label className="mt-4 block max-w-md">
          <span className={dashboardLabelClass}>{d.venue}</span>
          <select
            value={venueId}
            onChange={(e) => onVenueChange(e.target.value)}
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
    </div>
  );
}

export function SettingsPersonnelPanel({
  venues,
}: {
  venues: (VenueSpotVenue & { staffToken?: string })[];
}) {
  return <VenueStaffSetup venues={venues} />;
}

export function SettingsKitchenPanel({ venues }: { venues: VenueSpotVenue[] }) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
  const { venueId, setVenueId } = useVenuePicker(venues);

  return (
    <div className="space-y-5">
      <DepartmentTabIntro
        title={S.kitchenTab.title}
        description={S.kitchenTab.description}
        hint={S.kitchenTab.steps}
        venues={venues}
        venueId={venueId}
        onVenueChange={setVenueId}
      />
      <StationScreensPanel station="kitchen" venues={venues} venueId={venueId} embedded />
      <StationScreensPanel station="cold" venues={venues} venueId={venueId} embedded />
    </div>
  );
}

export function SettingsBarPanel({ venues }: { venues: VenueSpotVenue[] }) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
  const { venueId, setVenueId } = useVenuePicker(venues);

  return (
    <div className="space-y-5">
      <DepartmentTabIntro
        title={S.barTab.title}
        description={S.barTab.description}
        hint={S.barTab.steps}
        venues={venues}
        venueId={venueId}
        onVenueChange={setVenueId}
      />
      <StationScreensPanel station="bar" venues={venues} venueId={venueId} embedded />
      <StationScreensPanel station="dessert" venues={venues} venueId={venueId} embedded />
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

  return (
    <div className="space-y-5">
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
        <p className="mt-3">
          <a
            href="/dashboard/history"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
          >
            {S.services.historyLink}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      </div>
    </div>
  );
}
