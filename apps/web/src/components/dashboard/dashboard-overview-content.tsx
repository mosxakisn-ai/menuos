"use client";

import Link from "next/link";
import {
  CreditCard,
  ExternalLink,
  Monitor,
  Plus,
  QrCode,
  Sparkles,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { isTrialPlan } from "@menuos/shared";
import { live360NavUpgradeHref } from "@/lib/dashboard-nav";
import { WelcomeTrialCard } from "@/components/dashboard/welcome-trial-card";
import { DashboardStatCard, dashboardCardClass } from "@/components/dashboard/dashboard-page";
import { DashboardDocumentTitle } from "@/components/dashboard/localized-dashboard-page-header";
import { useDashboardCopy } from "@/components/dashboard/dashboard-locale-provider";
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
  passTodayCount?: number | null;
  passAvgDeliveryMin?: number | null;
  live360Enabled?: boolean;
  onboardingComplete?: boolean;
  qrVisited?: boolean;
};

function OverviewBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
      {children}
    </span>
  );
}

function QuickActionTile({
  href,
  external,
  icon: Icon,
  title,
  description,
  primary,
}: {
  href: string;
  external?: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  primary?: boolean;
}) {
  const className = cn(
    "group flex h-full flex-col rounded-xl border p-4 transition",
    primary
      ? "border-brand-blue/20 bg-gradient-to-br from-brand-blue to-brand-cyan text-white shadow-md hover:shadow-lg"
      : "border-slate-200/80 bg-white hover:border-brand-blue/25 hover:shadow-md",
  );

  const content = (
    <>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          primary ? "bg-white/15" : "bg-brand-blue/10 text-brand-blue",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className={cn("mt-3 text-sm font-semibold", primary ? "text-white" : "text-brand-navy")}>{title}</p>
      <p className={cn("mt-1 text-xs leading-snug", primary ? "text-white/85" : "text-slate-500")}>
        {description}
      </p>
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

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
  passTodayCount,
  passAvgDeliveryMin,
  live360Enabled = false,
  onboardingComplete = true,
  qrVisited = false,
}: DashboardOverviewProps) {
  const { d, lang, planLabel } = useDashboardCopy();
  const O = d.overview;
  const venueWord = venueCount === 1 ? d.venue.toLowerCase() : d.venues.toLowerCase();
  const menuWord = menuCount === 1 ? O.catalogOne : O.catalogMany;
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
  const showPassStats = live360Enabled && venueCount > 0 && passTodayCount != null;

  return (
    <div className="space-y-5">
      <DashboardDocumentTitle page="overview" />
      <WelcomeTrialCard show={showWelcome} trialEndsAt={trialEndsAt} trialPeriodDays={trialPeriodDays} />

      {onboardingComplete ? (
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-brand-blue/[0.05] px-5 py-5 shadow-card sm:px-6">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-cyan/10 blur-2xl" aria-hidden />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-brand-blue">
                <Sparkles className="h-4 w-4" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">{O.heroEyebrow}</span>
              </div>
              <h1 className="mt-2 font-serif text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.85rem]">
                {orgName ?? O.titleFallback}
              </h1>
            </div>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2">
            <OverviewBadge>{planLabel(planId)}</OverviewBadge>
            <OverviewBadge>
              {venueCount} {venueWord}
            </OverviewBadge>
            <OverviewBadge>
              {menuCount} {menuWord}
            </OverviewBadge>
            <OverviewBadge>{d.catalogEntry.count(itemCount)}</OverviewBadge>
          </div>
        </section>
      ) : null}

      {onboardingComplete ? (
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <section className={cn(dashboardCardClass, "lg:min-h-[320px]")}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{O.metricsTitle}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DashboardStatCard
                compact
                accent="blue"
                label={d.venues}
                value={venueCount}
                hint={venueCount === 0 ? O.addFirstVenue : undefined}
              />
              <DashboardStatCard
                compact
                accent="cyan"
                label={d.catalogEntry.label}
                value={itemCount}
                hint={itemCount === 0 ? O.addToCatalog : undefined}
              />
              <DashboardStatCard
                compact
                accent="slate"
                label={renewalStat.label}
                value={renewalStat.value}
                hint={renewalStat.hint}
              />
              {showPassStats ? (
                <>
                  <DashboardStatCard
                    compact
                    accent="blue"
                    label={O.passToday}
                    value={passTodayCount}
                    hint={O.passTodayHint}
                  />
                  <DashboardStatCard
                    compact
                    accent="cyan"
                    label={O.passAvgDelivery}
                    value={
                      passAvgDeliveryMin != null ? O.passAvgMinutes(passAvgDeliveryMin) : O.passAvgNone
                    }
                    hint={O.passAvgDeliveryHint}
                  />
                </>
              ) : null}
            </div>
          </section>

          <section className={cn(dashboardCardClass, "lg:min-h-[320px]")}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">{O.quickActions}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {itemCount === 0 ? O.quickStartEmpty : O.quickStartReady}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {venueCount === 0 ? (
                <QuickActionTile
                  href="/dashboard/venues/new"
                  icon={Plus}
                  title={d.addVenue}
                  description={O.actionVenue}
                  primary
                />
              ) : (
                <>
                  <QuickActionTile
                    href={`/dashboard/menus${firstVenueId ? `?venue=${firstVenueId}` : ""}`}
                    icon={UtensilsCrossed}
                    title={d.editCatalog}
                    description={O.actionCatalog}
                    primary
                  />
                  <QuickActionTile
                    href={`/dashboard/qr${firstVenueId ? `?venue=${firstVenueId}` : ""}`}
                    icon={QrCode}
                    title={d.qrCodes}
                    description={O.actionQr}
                  />
                  <QuickActionTile
                    href={live360Enabled ? "/dashboard/waiter" : live360NavUpgradeHref()}
                    icon={Monitor}
                    title={d.nav.waiter}
                    description={O.actionScreens}
                  />
                  {firstVenueSlug ? (
                    <QuickActionTile
                      href={`/m/${firstVenueSlug}`}
                      external
                      icon={ExternalLink}
                      title={d.livePreview}
                      description={O.actionPreview}
                    />
                  ) : (
                    <QuickActionTile
                      href={live360Enabled ? "/dashboard/history" : live360NavUpgradeHref()}
                      icon={Store}
                      title={d.nav.history}
                      description={O.actionHistory}
                    />
                  )}
                </>
              )}
              <QuickActionTile
                href="/dashboard/billing"
                icon={CreditCard}
                title={d.subscription}
                description={O.actionBilling}
              />
            </div>
          </section>
        </div>
      ) : null}
    </div>
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
