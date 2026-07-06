import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@menuos/db";
import { BillingConfirmHandler } from "@/components/dashboard/billing-confirm-handler";
import { BillingPlans } from "@/components/dashboard/billing-plans";
import { BillingVisitorIntentLabel } from "@/components/dashboard/billing-visitor-intent";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { SubscriptionInactiveBanner } from "@/components/dashboard/subscription-inactive-banner";
import { UpgradeReasonBanner } from "@/components/dashboard/upgrade-reason-banner";
import { getSession } from "@/lib/auth";
import { organizationHasActiveSubscription } from "@/lib/billing";
import { getEnterprisePlanEntrySafe, listPlanCatalogEntriesSafe } from "@/lib/plan-catalog-service";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";
import { formatSubscriptionSummary } from "@/lib/subscription-display";
import { DASHBOARD_LANG_COOKIE, parseDashboardLang } from "@/content/dashboard-i18n";

export async function generateMetadata(): Promise<Metadata> {
  return buildDashboardPageMetadata("billing", "/dashboard/billing");
}

type Props = { searchParams: Promise<{ inactive?: string; trial?: string }> };

export default async function BillingPage({ searchParams: _searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: session.organizationId },
  });
  const [hasActiveSubscription, plans, enterprisePlan] = await Promise.all([
    organizationHasActiveSubscription(session.organizationId),
    listPlanCatalogEntriesSafe(),
    getEnterprisePlanEntrySafe(),
  ]);
  const showInactive = !hasActiveSubscription;
  const cookieStore = await cookies();
  const lang = parseDashboardLang(cookieStore.get(DASHBOARD_LANG_COOKIE)?.value);
  const subscriptionSummary = formatSubscriptionSummary(
    subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
    lang,
  );
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  });
  const userEmail = user?.email ?? "";

  return (
    <DashboardPage wide>
      <BillingVisitorIntentLabel email={userEmail} />
      <LocalizedDashboardPageHeader page="billing" />

      <SubscriptionInactiveBanner
        show={showInactive}
        subscription={subscription ? { plan: subscription.plan, status: subscription.status } : null}
      />

      <Suspense fallback={null}>
        <UpgradeReasonBanner />
        <BillingConfirmHandler organizationId={session.organizationId} userEmail={userEmail} />
      </Suspense>

      <div id="plans">
        <BillingPlans
          organizationId={session.organizationId}
          userRole={session.role}
          userEmail={userEmail}
          plans={plans}
          enterprisePlan={enterprisePlan}
          subscriptionAccessActive={hasActiveSubscription}
          subscriptionSummary={subscriptionSummary}
          subscription={
            subscription
              ? {
                  plan: subscription.plan,
                  status: subscription.status,
                  trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
                  currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
                }
              : null
          }
        />
      </div>
    </DashboardPage>
  );
}
