import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@menuos/db";
import { BillingConfirmHandler } from "@/components/dashboard/billing-confirm-handler";
import { BillingPlans } from "@/components/dashboard/billing-plans";
import { DashboardPage, DashboardPageHeader } from "@/components/dashboard/dashboard-page";
import { SubscriptionInactiveBanner } from "@/components/dashboard/subscription-inactive-banner";
import { UpgradeReasonBanner } from "@/components/dashboard/upgrade-reason-banner";
import { getSession } from "@/lib/auth";
import { organizationHasActiveSubscription } from "@/lib/billing";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Συνδρομή", "/dashboard/billing");

type Props = { searchParams: Promise<{ inactive?: string; trial?: string }> };

export default async function BillingPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const sp = await searchParams;
  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: session.organizationId },
  });
  const hasActiveSubscription = await organizationHasActiveSubscription(session.organizationId);
  const showInactive =
    !hasActiveSubscription || sp.inactive === "1" || sp.trial === "expired";

  return (
    <DashboardPage>
      <DashboardPageHeader
        title="Συνδρομή"
        description="Διαχείριση συνδρομής MenuOS. Οι πληρωμές γίνονται με ασφάλεια online."
      />

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
