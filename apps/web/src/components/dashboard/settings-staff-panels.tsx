"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { PushNotificationsPrompt } from "@/components/dashboard/push-notifications-prompt";
import { SettingsForm, type SettingsVenue } from "@/components/dashboard/settings-form";
import { VenueTablesBySpacePanel } from "@/components/dashboard/venue-tables-by-space-panel";
import { VenueStaffSetup } from "@/components/dashboard/venue-staff-setup";
import {
  VenueOperationsConfigPanel,
} from "@/components/dashboard/venue-operations-config-panel";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

type VenueSpotVenue = { id: string; name: string; slug: string; staffToken?: string };

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

function TabIntro({
  title,
  description,
  hint,
  venues,
  venueId,
  onVenueChange,
  hideVenuePicker = false,
}: {
  title: string;
  description: string;
  hint?: string;
  venues: VenueSpotVenue[];
  venueId: string;
  onVenueChange: (id: string) => void;
  hideVenuePicker?: boolean;
}) {
  const { d } = useDashboardCopy();

  return (
    <div className={dashboardCardClass}>
      <h2 className="text-base font-semibold text-brand-navy">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {hint ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-slate-500">
          {hint.split("\n").map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {!hideVenuePicker && venues.length > 1 ? (
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

export function SettingsPersonnelPanel({ venues }: { venues: VenueSpotVenue[] }) {
  return <VenueStaffSetup venues={venues} />;
}

export function SettingsPostsPanel({ venues }: { venues: VenueSpotVenue[] }) {
  const { d } = useDashboardCopy();
  const T = d.pages.settings.postsTab;

  return (
    <VenueOperationsConfigPanel
      venues={venues}
      sections={["departments"]}
      showHeader={false}
      intro={{ title: T.title, description: T.description, hint: T.hint }}
    />
  );
}

export function SettingsVenuePanel({ venues }: { venues: SettingsVenue[] }) {
  return (
    <div className="space-y-5">
      <SettingsForm venues={venues} />
    </div>
  );
}

export function SettingsMessagesPanel({ venues }: { venues: VenueSpotVenue[] }) {
  const { d } = useDashboardCopy();
  const T = d.pages.settings.messagesTab;
  const { venueId, setVenueId } = useVenuePicker(venues);

  return (
    <div className="space-y-5">
      <TabIntro
        title={T.title}
        description={T.description}
        hint={T.hint}
        venues={venues}
        venueId={venueId}
        onVenueChange={setVenueId}
      />
      <VenueOperationsConfigPanel
        venues={venues}
        initialVenueId={venueId}
        sections={["chips", "map"]}
        showHeader={false}
        messagesByPost
        hideVenuePicker
      />
    </div>
  );
}

export function SettingsTablesPanel({ venues }: { venues: VenueSpotVenue[] }) {
  const { d } = useDashboardCopy();
  const T = d.pages.settings.tablesTab;
  const { venueId, setVenueId } = useVenuePicker(venues);

  return (
    <div className="space-y-5">
      <TabIntro
        title={T.title}
        description={T.description}
        hint={T.hint}
        venues={venues}
        venueId={venueId}
        onVenueChange={setVenueId}
      />
      <VenueTablesBySpacePanel venues={venues} venueId={venueId} />
    </div>
  );
}

export function SettingsSpacesPanel({
  venues,
}: {
  venues: (VenueSpotVenue & { staffToken?: string })[];
}) {
  const { d } = useDashboardCopy();
  const { venueId, setVenueId } = useVenuePicker(venues);

  return (
    <div className="space-y-5">
      {venues.length > 1 ? (
        <label className="block max-w-md">
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

      <VenueOperationsConfigPanel
        venues={venues}
        initialVenueId={venueId}
        sections={["zones"]}
        showHeader={false}
        hideVenuePicker
      />
    </div>
  );
}

export function SettingsGeneralExtrasPanel() {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className={`${dashboardCardClass} flex h-full flex-col`}>
        <h2 className="text-sm font-semibold text-primary">{S.services.pushSectionTitle}</h2>
        <p className="mt-2 text-sm text-slate-600">{S.services.pushHint}</p>
        <div className="mt-4 flex-1">
          <PushNotificationsPrompt variant="settings" flat />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{S.services.staffPushHint}</p>
      </div>

      <div className={`${dashboardCardClass} flex h-full flex-col`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">{S.services.passTitle}</h2>
          <a
            href="/dashboard/waiter"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
          >
            {S.services.livePanelLink}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mt-2 flex-1 text-sm text-slate-600">{S.services.passHint}</p>
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
