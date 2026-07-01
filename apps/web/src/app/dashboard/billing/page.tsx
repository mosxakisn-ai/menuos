import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@menuos/db";
import { BillingConfirmHandler } from "@/components/dashboard/billing-confirm-handler";
import { BillingPlans } from "@/components/dashboard/billing-plans";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { LocalizedDashboardPageHeader } from "@/components/dashboard/localized-dashboard-page-header";
import { SubscriptionInactiveBanner } from "@/components/dashboard/subscription-inactive-banner";
import { UpgradeReasonBanner } from "@/components/dashboard/upgrade-reason-banner";
import { getSession } from "@/lib/auth";
import { organizationHasActiveSubscription } from "@/lib/billing";
import { getEnterprisePlanEntrySafe, listPlanCatalogEntriesSafe } from "@/lib/plan-catalog-service";
import { buildDashboardPageMetadata } from "@/lib/dashboard-page-metadata";

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

  return (
    <DashboardPage>
      <LocalizedDashboardPageHeader page="billing" />

      <SubscriptionInactiveBanner
        show={showInactive}
        subscription={subscription ? { plan: subscription.plan, status: subscription.status } : null}
      />

      <Suspense fallback={null}>
        <UpgradeReasonBanner />
        <BillingConfirmHandler organizationId={session.organizationId} />
      </Suspense>

      <div id="plans">
        <BillingPlans
          organizationId={session.organizationId}
          userRole={session.role}
          plans={plans}
          enterprisePlan={enterprisePlan}
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
