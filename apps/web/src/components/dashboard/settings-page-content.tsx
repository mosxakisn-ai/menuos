"use client";

import { Suspense } from "react";
import { DashboardPage, DashboardPageHeader, dashboardCardClass } from "@/components/dashboard/dashboard-page";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { type SettingsVenue } from "@/components/dashboard/settings-form";
import {
  SettingsGeneralExtrasPanel,
  SettingsMessagesPanel,
  SettingsPersonnelPanel,
  SettingsPostsPanel,
  SettingsScreensPanel,
  SettingsSpacesPanel,
  SettingsTablesPanel,
  SettingsVenuePanel,
} from "@/components/dashboard/settings-staff-panels";
import { Live360FeatureGate } from "@/components/dashboard/live360-feature-gate";
import { SettingsTabs, type SettingsTabId, SETTINGS_TAB_IDS, isSettingsTabLocked } from "@/components/dashboard/settings-tabs";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";

export type SettingsVenueFull = SettingsVenue & {
  slug: string;
  staffToken?: string;
  kitchenScreenToken?: string;
  barScreenToken?: string;
  coldScreenToken?: string;
  dessertScreenToken?: string;
};

function SettingsGeneralTab({
  email,
  name,
  role,
  showManagerExtras,
  live360Enabled,
}: {
  email: string;
  name: string;
  role: string;
  showManagerExtras: boolean;
  live360Enabled: boolean;
}) {
  const { d, roleLabel } = useDashboardCopy();

  return (
    <div className="space-y-5">
      <div className={dashboardCardClass}>
        <h2 className="text-sm font-semibold text-primary">{d.account}</h2>
        <dl className="mt-4 divide-y divide-slate-100 text-sm">
          <div className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-slate-500">{d.accountEmail}</dt>
            <dd className="font-medium text-primary sm:text-right">{email}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-slate-500">{d.pages.settings.nameLabel}</dt>
            <dd className="text-slate-700 sm:text-right">{name}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <dt className="shrink-0 text-slate-500">{d.pages.settings.roleLabel}</dt>
            <dd className="text-slate-700 sm:text-right">{roleLabel(role)}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-primary">{d.changePassword.title}</h2>
          <div className="mt-4 max-w-md">
            <ChangePasswordForm compact />
          </div>
        </div>
      </div>

      {showManagerExtras && live360Enabled ? <SettingsGeneralExtrasPanel /> : null}
    </div>
  );
}

function SettingsPageBody({
  email,
  name,
  role,
  canManageVenue,
  venues,
  live360Enabled,
}: {
  email: string;
  name: string;
  role: string;
  canManageVenue: boolean;
  venues: SettingsVenueFull[];
  live360Enabled: boolean;
}) {
  const { d } = useDashboardCopy();
  const spotVenues = venues.map((v) => ({ id: v.id, name: v.name, slug: v.slug }));
  const allowedTabs: SettingsTabId[] = canManageVenue ? [...SETTINGS_TAB_IDS] : ["general"];

  function renderTab(tab: SettingsTabId) {
    let content: React.ReactNode;
    switch (tab) {
      case "general":
        content = (
          <SettingsGeneralTab
            email={email}
            name={name}
            role={role}
            showManagerExtras={canManageVenue}
            live360Enabled={live360Enabled}
          />
        );
        break;
      case "staff":
        content = (
          <SettingsPersonnelPanel
            venues={venues.map((v) => ({
              id: v.id,
              name: v.name,
              slug: v.slug,
            }))}
          />
        );
        break;
      case "posts":
        content = <SettingsPostsPanel venues={spotVenues} />;
        break;
      case "screens":
        content = <SettingsScreensPanel venues={spotVenues} />;
        break;
      case "venue":
        content = <SettingsVenuePanel venues={venues} />;
        break;
      case "messages":
        content = <SettingsMessagesPanel venues={spotVenues} />;
        break;
      case "tables":
        content = <SettingsTablesPanel venues={spotVenues} />;
        break;
      case "spaces":
        content = (
          <SettingsSpacesPanel
            venues={venues.map((v) => ({
              id: v.id,
              name: v.name,
              slug: v.slug,
              staffToken: v.staffToken,
            }))}
          />
        );
        break;
      default:
        content = null;
    }

    if (isSettingsTabLocked(tab, live360Enabled)) {
      return (
        <Live360FeatureGate enabled={false} staffMode={role === "STAFF"}>
          {content}
        </Live360FeatureGate>
      );
    }

    return content;
  }

  return (
    <DashboardPage wide className="space-y-5">
      <DashboardPageHeader title={d.pages.settings.title} description={d.pages.settings.description} />
      <SettingsTabs allowedTabs={allowedTabs} live360Enabled={live360Enabled}>
        {(tab) => renderTab(tab)}
      </SettingsTabs>
    </DashboardPage>
  );
}

export function SettingsPageContent({
  email,
  name,
  role,
  canManageVenue,
  venues,
  live360Enabled,
}: {
  email: string;
  name: string;
  role: string;
  canManageVenue: boolean;
  venues: SettingsVenueFull[];
  live360Enabled: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <SettingsPageBody
        email={email}
        name={name}
        role={role}
        canManageVenue={canManageVenue}
        venues={venues}
        live360Enabled={live360Enabled}
      />
    </Suspense>
  );
}
