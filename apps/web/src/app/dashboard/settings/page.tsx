import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { SettingsPageContent } from "@/components/dashboard/settings-page-content";
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
    <SettingsPageContent
      email={session!.email}
      name={session!.name}
      role={session!.role}
      venues={venues}
    />
  );
}
