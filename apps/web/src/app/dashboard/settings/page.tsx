import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { Card } from "@/components/ui/card";
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
    <DashboardPage wide className="space-y-4">
      <DashboardPageHeader
        title="Ρυθμίσεις"
        description="Λογαριασμός, κωδικός και εμφάνιση καταλόγου."
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-primary">{DASHBOARD_EL.account}</h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div>
              <dt className="text-slate-500">{DASHBOARD_EL.accountEmail}</dt>
              <dd className="mt-0.5 font-medium text-primary">{session!.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Όνομα</dt>
              <dd className="mt-0.5 text-slate-700">{session!.name}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Ρόλος</dt>
              <dd className="mt-0.5 text-slate-700">{roleLabel(session!.role)}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-primary">{DASHBOARD_EL.changePassword.title}</h2>
          <div className="mt-3">
            <ChangePasswordForm compact />
          </div>
        </Card>
      </div>

      <SettingsForm venues={venues} />
    </DashboardPage>
  );
}
