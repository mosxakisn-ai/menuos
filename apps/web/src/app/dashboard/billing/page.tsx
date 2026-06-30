import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@menuos/db";
import { BillingConfirmHandler } from "@/components/dashboard/billing-confirm-handler";
import { BillingPlans } from "@/components/dashboard/billing-plans";
import { TrialExpiredBanner } from "@/components/dashboard/trial-expired-banner";
import { UpgradeReasonBanner } from "@/components/dashboard/upgrade-reason-banner";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const metadata: Metadata = buildPrivatePageMetadata("Συνδρομή", "/dashboard/billing");

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId: session.organizationId },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">Συνδρομή</h1>
        <p className="text-sm text-slate-600">
          Διαχείριση συνδρομής MenuOS. Οι πληρωμές γίνονται με ασφάλεια μέσω Stripe.
        </p>
      </div>

      <Suspense fallback={null}>
        <UpgradeReasonBanner />
        <BillingConfirmHandler organizationId={session.organizationId} />
        <TrialExpiredBanner />
      </Suspense>

      <div id="plans">
        <BillingPlans
        organizationId={session.organizationId}
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
    </div>
  );
}
