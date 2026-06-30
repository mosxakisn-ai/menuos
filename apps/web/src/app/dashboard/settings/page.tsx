import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { SettingsForm } from "@/components/dashboard/settings-form";
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
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Ρυθμίσεις</h1>
        <p className="text-sm text-slate-600">
          Χρώματα και εμφάνιση — αυτά βλέπουν οι πελάτες όταν ανοίγουν τον κατάλογο από το QR.
        </p>
      </div>
      <Card>
        <h2 className="font-semibold text-primary">{DASHBOARD_EL.account}</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">{DASHBOARD_EL.accountEmail}</dt>
            <dd className="font-medium text-primary">{session!.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Όνομα</dt>
            <dd className="text-slate-700">{session!.name}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ρόλος</dt>
            <dd className="text-slate-700">{roleLabel(session!.role)}</dd>
          </div>
        </dl>
      </Card>
      <SettingsForm venues={venues} />
    </div>
  );
}
