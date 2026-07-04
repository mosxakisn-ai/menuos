import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { prisma } from "@menuos/db";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardLocaleProvider } from "@/components/dashboard/dashboard-locale-provider";
import { DashboardDiagnosticsReporter } from "@/components/dashboard/dashboard-diagnostics-reporter";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { TrialStatusBanner } from "@/components/dashboard/trial-status-banner";
import { OnboardingLegacyQrSync } from "@/components/dashboard/onboarding-legacy-qr-sync";
import { OnboardingWizard, type OnboardingState } from "@/components/dashboard/onboarding-wizard";
import { getSession } from "@/lib/auth";
import { loginUrlWithCallback } from "@/lib/safe-callback-url";
import { isTrialPlan, isTrialStillActive, getTrialPeriodDays } from "@menuos/shared";
import { organizationHasActiveSubscription, organizationHasLive360 } from "@/lib/billing";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { formatSubscriptionSummary } from "@/lib/subscription-display";
import { resolveBusinessDisplay } from "@/lib/business-display";
import {
  DASHBOARD_LANG_COOKIE,
  parseDashboardLang,
} from "@/content/dashboard-i18n";
import { playfair } from "@/lib/fonts";
import { ONBOARDING_QR_COOKIE } from "@/lib/onboarding-constants";
import {
  getOnboardingStatus,
  isOnboardingComplete,
  isOnboardingPathAllowed,
} from "@/lib/onboarding-status";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const session = await getSession();
  if (!session) {
    const pathname = headersList.get("x-menuos-pathname") ?? "/dashboard";
    const search = headersList.get("x-menuos-search") ?? "";
    redirect(loginUrlWithCallback(pathname + search));
  }
  if (headersList.get("x-menuos-check-subscription") === "1") {
    const active = await organizationHasActiveSubscription(session.organizationId);
    if (!active) {
      const pathname = headersList.get("x-menuos-pathname") ?? "";
      // STAFF cannot open billing (middleware) — keep them on waiter with a flag instead of looping.
      if (session.role === "STAFF") {
        if (!pathname.startsWith("/dashboard/waiter")) {
          redirect("/dashboard/waiter?inactive=1");
        }
      } else {
        const billingParams = new URLSearchParams({ inactive: "1" });
        const search = headersList.get("x-menuos-search") ?? "";
        const upgrade = new URLSearchParams(search).get("upgrade");
        if (upgrade) {
          billingParams.set("upgrade", upgrade);
        } else if (pathname.startsWith("/dashboard/menus/import")) {
          billingParams.set("upgrade", "pdf-import");
        } else if (
          pathname.startsWith("/dashboard/waiter") ||
          pathname.startsWith("/dashboard/history")
        ) {
          billingParams.set("upgrade", "live-360");
        }
        redirect(`/dashboard/billing?${billingParams.toString()}`);
      }
    }
  }

  const cookieStore = await cookies();
  const initialLang = parseDashboardLang(cookieStore.get(DASHBOARD_LANG_COOKIE)?.value);
  const dashboardPathname = headersList.get("x-menuos-pathname") ?? "/dashboard";

  let onboardingLocked = false;
  let onboardingWizardState: OnboardingState | null = null;
  let qrVisited = false;
  if (session.role !== "STAFF") {
    const onboardingStatus = await getOnboardingStatus(session.organizationId);
    qrVisited = cookieStore.get(ONBOARDING_QR_COOKIE)?.value === "1";
    onboardingLocked = !isOnboardingComplete(onboardingStatus, qrVisited);
    if (onboardingLocked) {
      onboardingWizardState = {
        hasVenue: onboardingStatus.hasVenue,
        hasCategory: onboardingStatus.hasCategory,
        hasItem: onboardingStatus.hasItem,
        venueId: onboardingStatus.firstVenueId,
        venueSlug: onboardingStatus.firstVenueSlug,
        itemCount: onboardingStatus.itemCount,
      };
      if (!isOnboardingPathAllowed(dashboardPathname, onboardingStatus, qrVisited)) {
        redirect("/dashboard");
      }
    }
  }

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

  const planId = org?.subscription?.plan ?? "TRIAL";
  const live360Enabled = await organizationHasLive360(session.organizationId);

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
  const initialMonitorCount = live360Enabled ? pendingWaiterCount + passSignalCount : 0;

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

  let trialItemCount = 0;
  if (showTrialBanner && session.role !== "STAFF") {
    trialItemCount = await prisma.item.count({
      where: { category: { menu: { venue: { organizationId: session.organizationId } } } },
    });
  }

  return (
    <DashboardLocaleProvider initialLang={initialLang}>
      <div className={playfair.variable}>
      <DashboardDiagnosticsReporter />
      <ConfirmDialogHost />
      <OnboardingLegacyQrSync enabled={onboardingLocked} />
      <div className="dashboard-shell flex min-h-screen bg-brand-surface">
        <DashboardSidebar
          initialPendingCount={initialMonitorCount}
          subscription={subscription}
          userRole={session.role}
          planId={planId}
          live360Enabled={live360Enabled}
          onboardingLocked={onboardingLocked}
        />
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
              {showTrialBanner && trialEndsAtIso && !dashboardPathname.startsWith("/dashboard/billing") ? (
                <div className="mb-6">
                  <TrialStatusBanner
                    trialEndsAt={trialEndsAtIso}
                    trialPeriodDays={trialPeriodDays}
                    planId={planId}
                    itemCount={trialItemCount}
                    onboardingLocked={onboardingLocked}
                  />
                </div>
              ) : null}
              {children}
            </div>
          </main>
        </div>
        {onboardingLocked && onboardingWizardState ? (
          <OnboardingWizard state={onboardingWizardState} qrVisited={qrVisited} />
        ) : null}
        <DashboardMobileNav
          initialPendingCount={initialMonitorCount}
          userRole={session.role}
          planId={planId}
          live360Enabled={live360Enabled}
          onboardingLocked={onboardingLocked}
        />
      </div>
      </div>
    </DashboardLocaleProvider>
  );
}
