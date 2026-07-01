"use client";

import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { SettingsForm, type SettingsVenue } from "@/components/dashboard/settings-form";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { dashboardCardClass } from "@/components/dashboard/dashboard-page";

export function SettingsPageContent({
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
    <DashboardPage wide className="space-y-5">
      <DashboardPageHeader title={d.pages.settings.title} description={d.pages.settings.description} />

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
    </DashboardPage>
  );
}
