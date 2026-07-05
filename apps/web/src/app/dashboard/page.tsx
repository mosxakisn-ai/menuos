import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@menuos/db";
import { getTrialPeriodDays } from "@menuos/shared";
import { DashboardOverviewContent } from "@/components/dashboard/dashboard-overview-content";
import { DashboardPage as DashboardPageShell } from "@/components/dashboard/dashboard-page";
import { getSession } from "@/lib/auth";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";
import { ensureOnboardingVenuesForOrganization } from "@/lib/seed-onboarding-venue";
import { organizationHasLive360 } from "@/lib/billing";
import { resolveOnboardingCookies } from "@/lib/onboarding-cookies";
import { isOnboardingComplete } from "@/lib/onboarding-status";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { startOfTodayAthens } from "@/lib/athens-day";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("overview", "/dashboard");
}

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
  if (session!.role === "STAFF") redirect("/dashboard/waiter");
  try {
    await ensureOnboardingVenuesForOrganization(session!.organizationId);
  } catch (err) {
    console.error("[onboarding-seed] dashboard backfill failed", err);
  }
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

  const venueIds = venues.map((v) => v.id);
  let passTodayCount: number | null = null;
  let passAvgDeliveryMin: number | null = null;

  if (venueIds.length > 0) {
    const todayStart = startOfTodayAthens();
    passTodayCount = await prisma.passSignal.count({
      where: { venueId: { in: venueIds }, readyAt: { gte: todayStart } },
    });

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const delivered = await prisma.passSignal.findMany({
      where: {
        venueId: { in: venueIds },
        status: "DELIVERED",
        deliveredAt: { gte: weekAgo, not: null },
        readyAt: { gte: weekAgo },
      },
      select: { readyAt: true, pickedUpAt: true, deliveredAt: true },
      orderBy: { deliveredAt: "desc" },
      take: 500,
    });
    const durations = delivered
      .filter((row) => row.deliveredAt)
      .map((row) => {
        const end = row.pickedUpAt ?? row.deliveredAt!;
        return (end.getTime() - row.readyAt.getTime()) / 60_000;
      })
      .filter((minutes) => minutes >= 0 && minutes <= 180);
    if (durations.length > 0) {
      passAvgDeliveryMin = Math.round(
        durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length,
      );
    }
  }

  const live360Enabled = await organizationHasLive360(session!.organizationId);
  const cookieStore = await cookies();
  const onboardingStatus = {
    hasVenue: venueCount > 0,
    hasCategory,
    hasItem: itemCount > 0,
    venueCount,
    menuCount,
    itemCount,
    firstVenueId: firstVenue?.id,
    firstVenueSlug: firstVenue?.slug,
    firstVenueCreatedAt: firstVenue?.createdAt,
    catalogPreview: [],
  };
  const { qrVisited, confirmed } = resolveOnboardingCookies(cookieStore, onboardingStatus);
  const onboardingComplete = isOnboardingComplete(onboardingStatus, qrVisited, confirmed);

  return (
    <DashboardPageShell wide>
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
        passTodayCount={passTodayCount}
        passAvgDeliveryMin={passAvgDeliveryMin}
        live360Enabled={live360Enabled}
        onboardingComplete={onboardingComplete}
        qrVisited={qrVisited}
      />
    </DashboardPageShell>
  );
}
