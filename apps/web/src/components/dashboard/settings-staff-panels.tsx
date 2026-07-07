"use client";

import { useEffect, useState } from "react";
import type { OrganizationNotificationSettings } from "@menuos/shared";
import { PushNotificationsPrompt } from "@/components/dashboard/push-notifications-prompt";
import { SettingsForm, type SettingsVenue } from "@/components/dashboard/settings-form";
import { VenueTablesBySpacePanel } from "@/components/dashboard/venue-tables-by-space-panel";
import { VenueStaffSetup } from "@/components/dashboard/venue-staff-setup";
import {
  VenueOperationsConfigPanel,
} from "@/components/dashboard/venue-operations-config-panel";
import { dashboardCardClass, dashboardFieldClass, dashboardLabelClass } from "@/components/dashboard/dashboard-page";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { cn } from "@/lib/utils";

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

  return (
    <VenueOperationsConfigPanel
      venues={venues}
      sections={["chips", "map"]}
      showHeader={false}
      messagesByPost
      intro={{ title: T.title, description: T.description }}
    />
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

function YesNoToggle({
  value,
  onChange,
  yesLabel,
  noLabel,
  ariaLabelledBy,
  disabled = false,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  yesLabel: string;
  noLabel: string;
  ariaLabelledBy?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5 self-end rounded-full border border-slate-200/90 bg-white p-0.5 shadow-sm sm:self-auto"
      role="group"
      aria-labelledby={ariaLabelledBy}
    >
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled}
        aria-pressed={value}
        className={cn(
          "min-w-[2.75rem] rounded-full px-3 py-1.5 text-xs font-bold transition",
          value
            ? "bg-brand-gradient text-white shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-primary",
        )}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        aria-pressed={!value}
        className={cn(
          "min-w-[2.75rem] rounded-full px-3 py-1.5 text-xs font-bold transition",
          !value
            ? "bg-brand-gradient text-white shadow-sm"
            : "text-slate-500 hover:bg-slate-50 hover:text-primary",
        )}
      >
        {noLabel}
      </button>
    </div>
  );
}

function NotificationToggleRow({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  yesLabel: string;
  noLabel: string;
  disabled?: boolean;
}) {
  const labelId = `notification-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p id={labelId} className="min-w-0 flex-1 text-sm font-medium text-primary">
        {label}
      </p>
      <YesNoToggle
        value={value}
        onChange={onChange}
        yesLabel={yesLabel}
        noLabel={noLabel}
        ariaLabelledBy={labelId}
        disabled={disabled}
      />
    </div>
  );
}

export function SettingsGeneralExtrasPanel({
  initialNotifications,
}: {
  initialNotifications: OrganizationNotificationSettings;
}) {
  const { d } = useDashboardCopy();
  const S = d.pages.settings;
  const N = S.services.notifications;
  const [settings, setSettings] = useState(initialNotifications);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setSettings(initialNotifications);
  }, [initialNotifications]);

  async function persistSettings(next: OrganizationNotificationSettings) {
    const previous = settings;
    setSettings(next);
    setSaving(true);
    try {
      const res = await fetch("/api/organization/notification-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "save failed");
      setSettings(data.settings ?? next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      setSettings(previous);
    } finally {
      setSaving(false);
    }
  }

  function updateSetting(key: keyof OrganizationNotificationSettings, value: boolean) {
    void persistSettings({ ...settings, [key]: value });
  }

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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-primary">{N.title}</h2>
          {saving ? (
            <span className="text-xs font-medium text-slate-500">{N.saving}</span>
          ) : savedFlash ? (
            <span className="text-xs font-semibold text-emerald-600">{N.saved}</span>
          ) : null}
        </div>
        <div className="mt-4 flex flex-1 flex-col gap-3">
          <NotificationToggleRow
            label={N.customerOrder}
            value={settings.customerOrdersEnabled}
            onChange={(value) => updateSetting("customerOrdersEnabled", value)}
            yesLabel={N.yes}
            noLabel={N.no}
            disabled={saving}
          />
          <NotificationToggleRow
            label={N.waiterCall}
            value={settings.waiterCallEnabled}
            onChange={(value) => updateSetting("waiterCallEnabled", value)}
            yesLabel={N.yes}
            noLabel={N.no}
            disabled={saving}
          />
          <NotificationToggleRow
            label={N.voiceMessages}
            value={settings.voiceMessagesEnabled}
            onChange={(value) => updateSetting("voiceMessagesEnabled", value)}
            yesLabel={N.yes}
            noLabel={N.no}
            disabled={saving}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{N.voiceHint}</p>
      </div>
    </div>
  );
}
