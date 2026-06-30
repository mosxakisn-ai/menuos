import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import {
  DashboardPage,
  DashboardPageHeader,
  dashboardCardClass,
} from "@/components/dashboard/dashboard-page";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { DASHBOARD_EL, roleLabel } from "@/content/dashboard-el";

export const metadata: Metadata = buildPrivatePageMetadata("Settings", "/dashboard/settings");

export default async function SettingsPage() {
  const session = await getSession();
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardPage wide className="space-y-5">
      <DashboardPageHeader
        title="Ρυθμίσεις"
        description="Λογαριασμός, κωδικός και εμφάνιση καταλόγου."
      />

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className={dashboardCardClass}>
          <h2 className="text-sm font-semibold text-primary">{DASHBOARD_EL.account}</h2>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="shrink-0 text-slate-500">{DASHBOARD_EL.accountEmail}</dt>
              <dd className="font-medium text-primary sm:text-right">{session!.email}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="shrink-0 text-slate-500">Όνομα</dt>
              <dd className="text-slate-700 sm:text-right">{session!.name}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <dt className="shrink-0 text-slate-500">Ρόλος</dt>
              <dd className="text-slate-700 sm:text-right">{roleLabel(session!.role)}</dd>
            </div>
          </dl>
        </div>

        <div className={dashboardCardClass}>
          <h2 className="text-sm font-semibold text-primary">{DASHBOARD_EL.changePassword.title}</h2>
          <div className="mt-4">
            <ChangePasswordForm compact />
          </div>
        </div>
      </div>

      <SettingsForm venues={venues} />
    </DashboardPage>
  );
}
