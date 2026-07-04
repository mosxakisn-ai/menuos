import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import type { UserRole } from "@menuos/db";
import { SettingsPageContent } from "@/components/dashboard/settings-page-content";
import { getSession } from "@/lib/auth";
import { organizationHasLive360 } from "@/lib/billing";
import { canManageVenueSecrets } from "@/lib/dashboard-roles";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("settings", "/dashboard/settings");
}

export default async function SettingsPage() {
  const session = await getSession();
  const canManage = canManageVenueSecrets(session!.role as UserRole);
  const venuesRaw = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      cuisineType: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      ...(canManage
        ? {
            staffToken: true,
            kitchenScreenToken: true,
            barScreenToken: true,
            coldScreenToken: true,
            dessertScreenToken: true,
          }
        : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  const live360Enabled = await organizationHasLive360(session!.organizationId);

  return (
    <SettingsPageContent
      email={session!.email}
      name={session!.name}
      role={session!.role}
      canManageVenue={canManage}
      venues={venuesRaw}
      live360Enabled={live360Enabled}
    />
  );
}
