"use client";

import Link from "next/link";
import { isTrialPlan } from "@menuos/shared";
import { WelcomeTrialCard } from "@/components/dashboard/welcome-trial-card";
import {
  DashboardPageHeader,
  DashboardStatCard,
  dashboardCardClass,
  dashboardFormActionsClass,
} from "@/components/dashboard/dashboard-page";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { DashboardDocumentTitle } from "@/components/dashboard/localized-dashboard-page-header";
import { TrialLimitsHint } from "@/components/dashboard/trial-limits-hint";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
import { buttonClass } from "@/components/ui/button";
import { formatDashboardDate } from "@/content/dashboard-i18n";
import { cn } from "@/lib/utils";

export type DashboardOverviewProps = {
  showWelcome: boolean;
  orgName: string | null;
  planId: string;
  trialEndsAt: string | null;
  trialPeriodDays: number;
  venueCount: number;
  menuCount: number;
  itemCount: number;
  hasCategory: boolean;
  firstVenueId?: string;
  firstVenueSlug?: string;
  subscriptionPlan: string;
  subscriptionTrialEndsAt: string | null;
  subscriptionCurrentPeriodEnd: string | null;
};

export function DashboardOverviewContent({
  showWelcome,
  orgName,
  planId,
  trialEndsAt,
  trialPeriodDays,
  venueCount,
  menuCount,
  itemCount,
  hasCategory,
  firstVenueId,
  firstVenueSlug,
  subscriptionPlan,
  subscriptionTrialEndsAt,
  subscriptionCurrentPeriodEnd,
}: DashboardOverviewProps) {
  const { d, lang, planLabel } = useDashboardCopy();
  const venueWord = venueCount === 1 ? d.venue.toLowerCase() : d.venues.toLowerCase();
  const menuWord = menuCount === 1 ? d.overview.catalogOne : d.overview.catalogMany;
  const renewalStat = subscriptionRenewalStat(
    {
      plan: subscriptionPlan,
      trialEndsAt: subscriptionTrialEndsAt ? new Date(subscriptionTrialEndsAt) : null,
      currentPeriodEnd: subscriptionCurrentPeriodEnd ? new Date(subscriptionCurrentPeriodEnd) : null,
    },
    lang,
    d,
    planLabel,
  );

  return (
    <>
      <DashboardDocumentTitle page="overview" />
      <WelcomeTrialCard show={showWelcome} trialEndsAt={trialEndsAt} trialPeriodDays={trialPeriodDays} />
      <DashboardPageHeader
        title={orgName ?? d.overview.titleFallback}
        description={d.overview.planSummary(
          planLabel(planId),
          venueCount,
          venueWord,
          menuCount,
          menuWord,
          d.catalogEntry.count(itemCount),
        )}
      />

      <TrialLimitsHint plan={planId} itemCount={itemCount} />

      <OnboardingWizard
        state={{
          hasVenue: venueCount > 0,
          hasCategory,
          hasItem: itemCount > 0,
          venueId: firstVenueId,
          venueSlug: firstVenueSlug,
          itemCount,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label={d.venues}
          value={venueCount}
          hint={venueCount === 0 ? d.overview.addFirstVenue : undefined}
        />
        <DashboardStatCard
          label={d.catalogEntry.label}
          value={itemCount}
          hint={itemCount === 0 ? d.overview.addToCatalog : undefined}
        />
        <DashboardStatCard label={renewalStat.label} value={renewalStat.value} hint={renewalStat.hint} />
      </div>

      <div className={dashboardCardClass}>
        <h2 className="text-center font-semibold text-primary sm:text-left">{d.overview.quickActions}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-slate-600 sm:mx-0 sm:text-left">
          {itemCount === 0 ? d.overview.quickStartEmpty : d.overview.quickStartReady}
        </p>
        <div className={cn(dashboardFormActionsClass, "mt-5 justify-center sm:justify-start")}>
          {venueCount === 0 ? (
            <Link href="/dashboard/venues/new" className={buttonClass("primary")}>
              + {d.addVenue}
            </Link>
          ) : (
            <>
              <Link
                href={`/dashboard/menus${firstVenueId ? `?venue=${firstVenueId}` : ""}`}
                className={buttonClass("primary")}
              >
                {d.editCatalog}
              </Link>
              <Link
                href={`/dashboard/qr${firstVenueId ? `?venue=${firstVenueId}` : ""}`}
                className={buttonClass("secondary")}
              >
                {d.qrCodes}
              </Link>
              <Link href="/dashboard/waiter" className={buttonClass("secondary")}>
                {d.calls} {d.overview.callsWaiterSuffix}
              </Link>
              {firstVenueSlug ? (
                <a
                  href={`/m/${firstVenueSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary")}
                >
                  {d.livePreview}
                </a>
              ) : null}
            </>
          )}
          <Link href="/dashboard/billing" className={buttonClass("secondary")}>
            {d.subscription}
          </Link>
        </div>
      </div>
    </>
  );
}

function subscriptionRenewalStat(
  sub: { plan: string; trialEndsAt: Date | null; currentPeriodEnd: Date | null },
  lang: "GR" | "EN",
  d: ReturnType<typeof useDashboardCopy>["d"],
  planLabelFn: (id: string) => string,
): { label: string; value: string; hint?: string } {
  if (!sub.plan) return { label: d.subscription, value: "—" };
  if (isTrialPlan(sub.plan) && sub.trialEndsAt) {
    return { label: d.trial.endsOn, value: formatDashboardDate(lang, sub.trialEndsAt) };
  }
  if (sub.currentPeriodEnd) {
    return { label: d.overview.renewalUntil, value: formatDashboardDate(lang, sub.currentPeriodEnd) };
  }
  return { label: d.overview.planField, value: planLabelFn(sub.plan) };
}
