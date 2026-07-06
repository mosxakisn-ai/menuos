"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Clock3,
  CreditCard,
  ExternalLink,
  Monitor,
  Plus,
  QrCode,
  Store,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { isTrialPlan } from "@menuos/shared";
import { live360NavUpgradeHref } from "@/lib/dashboard-nav";
import { WelcomeTrialCard } from "@/components/dashboard/welcome-trial-card";
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

function OverviewPanel({
  children,
  className,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: "none" | "1" | "2";
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.25rem] border border-slate-200/70 bg-white/90 p-5 shadow-card backdrop-blur-sm sm:p-6",
        delay === "1" && "animate-fade-up-delay opacity-0",
        delay === "2" && "animate-fade-up-delay-2 opacity-0",
        delay === "none" && "animate-fade-up opacity-0",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/35 to-transparent"
        aria-hidden
      />
      {children}
    </section>
  );
}

function OverviewSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{children}</p>
  );
}

function OverviewMetric({
  icon: Icon,
  label,
  value,
  hint,
  accent = "blue",
  featured,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: "blue" | "cyan" | "slate" | "violet";
  featured?: boolean;
}) {
  const accentStyles = {
    blue: {
      icon: "bg-brand-blue/10 text-brand-blue ring-brand-blue/15",
      glow: "from-brand-blue/12 to-transparent",
      value: "text-brand-navy",
    },
    cyan: {
      icon: "bg-brand-cyan/10 text-brand-cyan ring-brand-cyan/15",
      glow: "from-brand-cyan/12 to-transparent",
      value: "text-brand-navy",
    },
    slate: {
      icon: "bg-slate-100 text-slate-600 ring-slate-200/80",
      glow: "from-slate-100/90 to-transparent",
      value: "text-brand-navy",
    },
    violet: {
      icon: "bg-violet-500/10 text-violet-600 ring-violet-500/15",
      glow: "from-violet-500/10 to-transparent",
      value: "text-brand-navy",
    },
  }[accent];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:border-brand-blue/20 hover:shadow-cardHover",
        featured && "sm:col-span-2",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80 transition group-hover:opacity-100",
          accentStyles.glow,
        )}
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition group-hover:scale-105",
            accentStyles.icon,
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <p
            className={cn(
              "mt-1 font-serif text-3xl font-bold tabular-nums leading-none tracking-tight",
              accentStyles.value,
              featured && "text-[2rem]",
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-[11px] leading-snug text-slate-500">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function QuickActionTile({
  href,
  external,
  icon: Icon,
  title,
  description,
  primary,
  className,
}: {
  href: string;
  external?: boolean;
  icon: LucideIcon;
  title: string;
  description: string;
  primary?: boolean;
  className?: string;
}) {
  const tileClass = cn(
    "group relative flex h-full flex-col overflow-hidden rounded-2xl border p-4 transition duration-300 sm:p-5",
    primary
      ? "border-brand-blue/25 bg-gradient-to-br from-brand-blue via-brand-blue to-brand-cyan text-white shadow-[0_8px_32px_-8px_rgba(37,99,235,0.45)] hover:-translate-y-1 hover:shadow-[0_16px_40px_-10px_rgba(37,99,235,0.5)] sm:flex-row sm:items-center sm:gap-4"
      : "border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 hover:-translate-y-0.5 hover:border-brand-blue/25 hover:shadow-cardHover",
    className,
  );

  const content = (
    <>
      {primary ? (
        <div
          className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl transition duration-300 group-hover:scale-105",
          primary
            ? "h-11 w-11 bg-white/15 sm:h-12 sm:w-12"
            : "h-10 w-10 bg-brand-blue/[0.08] text-brand-blue ring-1 ring-brand-blue/10",
        )}
      >
        <Icon className={cn("h-5 w-5", primary && "text-white")} aria-hidden />
      </div>
      <div className={cn("relative mt-3 min-w-0 flex-1 sm:mt-0")}>
        <p className={cn("text-sm font-semibold tracking-tight", primary ? "text-white" : "text-brand-navy")}>
          {title}
        </p>
        <p className={cn("mt-1 text-xs leading-snug", primary ? "text-white/80" : "text-slate-500")}>
          {description}
        </p>
      </div>
      <ArrowRight
        className={cn(
          "relative mt-3 h-4 w-4 shrink-0 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 sm:mt-0",
          primary ? "text-white/90" : "text-brand-blue",
        )}
        aria-hidden
      />
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={tileClass}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={tileClass}>
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
  const catalogOnline = itemCount > 0;

  return (
    <div className="space-y-6">
      <DashboardDocumentTitle page="overview" />
      <WelcomeTrialCard
        show={showWelcome}
        trialEndsAt={trialEndsAt}
        trialPeriodDays={trialPeriodDays}
        onboardingComplete={onboardingComplete}
      />

      {onboardingComplete ? (
        <>
          <section className="animate-fade-up relative overflow-hidden rounded-xl border border-slate-800/20 bg-gradient-to-r from-[#0c1222] via-brand-navy to-[#0f172a] px-4 py-3.5 opacity-0 shadow-sm sm:px-5 sm:py-4">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(6,182,212,0.12),transparent_55%)]"
              aria-hidden
            />
            <div className="relative flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {O.heroEyebrow}
                  </span>
                  <h1 className="font-serif text-lg font-bold leading-snug tracking-tight text-white sm:text-xl">
                    {orgName ?? O.titleFallback}
                  </h1>
                </div>
                {!catalogOnline ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50 sm:line-clamp-1">
                    {O.quickStartEmpty}
                  </p>
                ) : null}
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/60">
                  <span>{planLabel(planId)}</span>
                  <span aria-hidden className="text-white/20">
                    ·
                  </span>
                  <span>
                    {venueCount} {venueWord}
                  </span>
                  <span aria-hidden className="text-white/20">
                    ·
                  </span>
                  <span>
                    {menuCount} {menuWord}
                  </span>
                  <span aria-hidden className="text-white/20">
                    ·
                  </span>
                  <span>{d.catalogEntry.count(itemCount)}</span>
                </p>
              </div>
              {catalogOnline ? (
                <div className="flex shrink-0 items-center gap-1.5 self-start rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 sm:self-center">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  {O.catalogLiveStatus}
                </div>
              ) : null}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <OverviewPanel className="lg:col-span-5 lg:min-h-[360px]" delay="1">
              <OverviewSectionLabel>{O.metricsTitle}</OverviewSectionLabel>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <OverviewMetric
                  icon={Store}
                  accent="blue"
                  label={d.venues}
                  value={venueCount}
                  hint={venueCount === 0 ? O.addFirstVenue : undefined}
                  featured={!showPassStats}
                />
                <OverviewMetric
                  icon={UtensilsCrossed}
                  accent="cyan"
                  label={d.catalogEntry.label}
                  value={itemCount}
                  hint={itemCount === 0 ? O.addToCatalog : undefined}
                  featured={!showPassStats}
                />
                <OverviewMetric
                  icon={CalendarDays}
                  accent="slate"
                  label={renewalStat.label}
                  value={renewalStat.value}
                  hint={renewalStat.hint}
                  featured
                />
                {showPassStats ? (
                  <>
                    <OverviewMetric
                      icon={Bell}
                      accent="violet"
                      label={O.passToday}
                      value={passTodayCount}
                      hint={O.passTodayHint}
                    />
                    <OverviewMetric
                      icon={Clock3}
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
            </OverviewPanel>

            <OverviewPanel className="lg:col-span-7 lg:min-h-[360px]" delay="2">
              <OverviewSectionLabel>{O.quickActions}</OverviewSectionLabel>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {itemCount === 0 ? O.quickStartEmpty : O.quickStartReady}
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {venueCount === 0 ? (
                  <QuickActionTile
                    href="/dashboard/venues/new"
                    icon={Plus}
                    title={d.addVenue}
                    description={O.actionVenue}
                    primary
                    className="sm:col-span-2"
                  />
                ) : (
                  <>
                    <QuickActionTile
                      href={`/dashboard/menus${firstVenueId ? `?venue=${firstVenueId}` : ""}`}
                      icon={UtensilsCrossed}
                      title={d.editCatalog}
                      description={O.actionCatalog}
                      primary
                      className="sm:col-span-2"
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
                  className={venueCount === 0 ? "sm:col-span-2" : undefined}
                />
              </div>
            </OverviewPanel>
          </div>
        </>
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
