import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { SettingsPageContent } from "@/components/dashboard/settings-page-content";
import { getSession } from "@/lib/auth";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("settings", "/dashboard/settings");
}

export default async function SettingsPage() {
  const session = await getSession();
  const venues = await prisma.venue.findMany({
    where: { organizationId: session!.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      staffToken: true,
      kitchenScreenToken: true,
      barScreenToken: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SettingsPageContent
      email={session!.email}
      name={session!.name}
      role={session!.role}
      venues={venues}
    />
  );
}
