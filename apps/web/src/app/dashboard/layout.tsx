import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { prisma } from "@menuos/db";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardLocaleProvider } from "@/components/dashboard/dashboard-locale-provider";
import { TrialStatusBanner } from "@/components/dashboard/trial-status-banner";
import { getSession } from "@/lib/auth";
import { isTrialPlan, isTrialStillActive, getTrialPeriodDays } from "@menuos/shared";
import { organizationHasActiveSubscription } from "@/lib/billing";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { formatSubscriptionSummary } from "@/lib/subscription-display";
import { resolveBusinessDisplay } from "@/lib/business-display";
import {
  DASHBOARD_LANG_COOKIE,
  parseDashboardLang,
} from "@/content/dashboard-i18n";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const headersList = await headers();
  if (headersList.get("x-menuos-check-subscription") === "1") {
    const active = await organizationHasActiveSubscription(session.organizationId);
    if (!active) {
      const pathname = headersList.get("x-menuos-pathname") ?? "";
      const billingParams = new URLSearchParams({ inactive: "1" });
      const search = headersList.get("x-menuos-search") ?? "";
      const upgrade = new URLSearchParams(search).get("upgrade");
      if (upgrade) {
        billingParams.set("upgrade", upgrade);
      } else if (pathname.startsWith("/dashboard/menus/import")) {
        billingParams.set("upgrade", "pdf-import");
      }
      redirect(`/dashboard/billing?${billingParams.toString()}`);
    }
  }

  const cookieStore = await cookies();
  const initialLang = parseDashboardLang(cookieStore.get(DASHBOARD_LANG_COOKIE)?.value);

  const [pendingWaiterCount, passSignalCount] = await Promise.all([
    prisma.waiterCall.count({
      where: {
        venue: { organizationId: session.organizationId },
        status: "PENDING",
      },
    }),
    prisma.passSignal.count({
      where: {
        venue: { organizationId: session.organizationId },
        status: { in: ["READY", "PICKED_UP"] },
      },
    }),
  ]);
  const initialMonitorCount = pendingWaiterCount + passSignalCount;

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    include: {
      subscription: true,
      venues: {
        select: {
          name: true,
          logoUrl: true,
          settings: { select: { brandName: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 5,
      },
    },
  });

  const business = org
    ? resolveBusinessDisplay({ organizationName: org.name, venues: org.venues })
    : { name: session.name, logoUrl: null };
  const subscription = org?.subscription
    ? {
        plan: org.subscription.plan,
        status: org.subscription.status,
        trialEndsAt: org.subscription.trialEndsAt,
        currentPeriodEnd: org.subscription.currentPeriodEnd,
      }
    : null;
  const subscriptionSummary = formatSubscriptionSummary(subscription, initialLang);
  const showTrialBanner =
    subscription?.plan &&
    isTrialPlan(subscription.plan) &&
    subscription.trialEndsAt &&
    isTrialStillActive(subscription.trialEndsAt);
  const trialEndsAtIso = subscription?.trialEndsAt?.toISOString() ?? null;
  const catalogTrialDays = await getTrialDaysFromCatalog();
  const trialPeriodDays =
    org?.subscription?.trialEndsAt && org?.createdAt
      ? getTrialPeriodDays(org.subscription.trialEndsAt, org.createdAt)
      : catalogTrialDays;

  return (
    <DashboardLocaleProvider initialLang={initialLang}>
      <div className="dashboard-shell flex min-h-screen bg-brand-surface">
        <DashboardSidebar initialPendingCount={initialMonitorCount} subscription={subscription} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader
            businessName={business.name}
            businessLogoUrl={business.logoUrl}
            role={session.role}
            subscriptionExpiryLine={subscriptionSummary.expiryLine}
            subscriptionActive={subscriptionSummary.active}
          />
          <main className="flex-1 bg-brand-surface/50 p-4 pb-24 sm:p-6 md:pb-8">
            <div className="mx-auto w-full max-w-6xl">
              {showTrialBanner && trialEndsAtIso ? (
                <div className="mb-6">
                  <TrialStatusBanner trialEndsAt={trialEndsAtIso} trialPeriodDays={trialPeriodDays} />
                </div>
              ) : null}
              {children}
            </div>
          </main>
        </div>
        <DashboardMobileNav initialPendingCount={initialMonitorCount} />
      </div>
    </DashboardLocaleProvider>
  );
}
