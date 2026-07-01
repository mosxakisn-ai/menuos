import type { Metadata } from "next";
import { prisma } from "@menuos/db";
import { isTrialPlan, getTrialPeriodDays } from "@menuos/shared";
import { DashboardOverviewContent } from "@/components/dashboard/dashboard-overview-content";
import { DashboardPage as DashboardPageShell } from "@/components/dashboard/dashboard-page";
import { getSession } from "@/lib/auth";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Επισκόπηση", "/dashboard");

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  const sp = await searchParams;
  const org = await prisma.organization.findUnique({
    where: { id: session!.organizationId },
    include: {
      venues: {
        include: {
          menus: {
            include: {
              categories: { include: { items: true } },
            },
          },
        },
      },
      subscription: true,
    },
  });

  const venues = org?.venues ?? [];
  const venueCount = venues.length;
  const menuCount = venues.reduce((n, v) => n + v.menus.length, 0);
  const itemCount = venues.reduce(
    (n, v) => n + v.menus.reduce((m, menu) => m + menu.categories.reduce((c, cat) => c + cat.items.length, 0), 0),
    0,
  );
  const firstVenue = venues[0];
  const hasCategory = venues.some((v) => v.menus.some((m) => m.categories.length > 0));

  const planId = org?.subscription?.plan ?? "TRIAL";
  const trialEndsAt = org?.subscription?.trialEndsAt?.toISOString() ?? null;
  const catalogTrialDays = await getTrialDaysFromCatalog();
  const trialPeriodDays =
    org?.subscription?.trialEndsAt && org.createdAt
      ? getTrialPeriodDays(org.subscription.trialEndsAt, org.createdAt)
      : catalogTrialDays;

  return (
    <DashboardPageShell>
      <DashboardOverviewContent
        showWelcome={sp.welcome === "1"}
        orgName={org?.name ?? null}
        planId={planId}
        trialEndsAt={trialEndsAt}
        trialPeriodDays={trialPeriodDays}
        venueCount={venueCount}
        menuCount={menuCount}
        itemCount={itemCount}
        hasCategory={hasCategory}
        firstVenueId={firstVenue?.id}
        firstVenueSlug={firstVenue?.slug}
        subscriptionPlan={org?.subscription?.plan ?? "TRIAL"}
        subscriptionTrialEndsAt={org?.subscription?.trialEndsAt?.toISOString() ?? null}
        subscriptionCurrentPeriodEnd={org?.subscription?.currentPeriodEnd?.toISOString() ?? null}
      />
    </DashboardPageShell>
  );
}
