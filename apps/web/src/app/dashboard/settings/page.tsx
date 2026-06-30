import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

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
        <p className="text-sm text-slate-600">Branding, χρώματα και στοιχεία venue.</p>
      </div>
      <SettingsForm venues={venues} />
    </div>
  );
}
