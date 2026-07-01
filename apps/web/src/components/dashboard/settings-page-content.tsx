"use client";

import { Suspense } from "react";
import { DashboardPage, DashboardPageHeader, dashboardCardClass } from "@/components/dashboard/dashboard-page";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { SettingsForm, type SettingsVenue } from "@/components/dashboard/settings-form";
import {
  SettingsBarPanel,
  SettingsKitchenPanel,
  SettingsPersonnelPanel,
  SettingsServicesPanel,
  SettingsTablesPanel,
} from "@/components/dashboard/settings-staff-panels";
import { SettingsTabs, type SettingsTabId } from "@/components/dashboard/settings-tabs";
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
  venues,
}: {
  email: string;
  name: string;
  role: string;
  venues: SettingsVenue[];
}) {
  const { d, roleLabel } = useDashboardCopy();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
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
        </div>

        <div className={dashboardCardClass}>
          <h2 className="text-sm font-semibold text-primary">{d.changePassword.title}</h2>
          <div className="mt-4">
            <ChangePasswordForm compact />
          </div>
        </div>
      </div>

      <SettingsForm venues={venues} />
    </div>
  );
}

function SettingsPageBody({
  email,
  name,
  role,
  venues,
}: {
  email: string;
  name: string;
  role: string;
  venues: SettingsVenueFull[];
}) {
  const { d } = useDashboardCopy();
  const spotVenues = venues.map((v) => ({ id: v.id, name: v.name, slug: v.slug }));

  function renderTab(tab: SettingsTabId) {
    switch (tab) {
      case "general":
        return <SettingsGeneralTab email={email} name={name} role={role} venues={venues} />;
      case "personnel":
        return <SettingsPersonnelPanel />;
      case "kitchen":
        return <SettingsKitchenPanel venues={venues} />;
      case "bar":
        return <SettingsBarPanel venues={venues} />;
      case "tables":
        return <SettingsTablesPanel venues={spotVenues} />;
      case "services":
        return <SettingsServicesPanel venues={venues} />;
      default:
        return null;
    }
  }

  return (
    <DashboardPage wide className="space-y-5">
      <DashboardPageHeader title={d.pages.settings.title} description={d.pages.settings.description} />
      <SettingsTabs>{(tab) => renderTab(tab)}</SettingsTabs>
    </DashboardPage>
  );
}

export function SettingsPageContent({
  email,
  name,
  role,
  venues,
}: {
  email: string;
  name: string;
  role: string;
  venues: SettingsVenueFull[];
}) {
  return (
    <Suspense fallback={null}>
      <SettingsPageBody email={email} name={name} role={role} venues={venues} />
    </Suspense>
  );
}
