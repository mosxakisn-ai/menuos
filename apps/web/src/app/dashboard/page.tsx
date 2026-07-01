import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@menuos/db";
import { isTrialPlan, getTrialPeriodDays } from "@menuos/shared";
import { WelcomeTrialCard } from "@/components/dashboard/welcome-trial-card";
import {
  DashboardPage as DashboardPageShell,
  DashboardPageHeader,
  DashboardStatCard,
  dashboardCardClass,
  dashboardFormActionsClass,
} from "@/components/dashboard/dashboard-page";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";
import { TrialLimitsHint } from "@/components/dashboard/trial-limits-hint";
import { buttonClass } from "@/components/ui/button";
import { DASHBOARD_EL, planLabel } from "@/content/dashboard-el";
import { getSession } from "@/lib/auth";
import { getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { buildPrivatePageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = buildPrivatePageMetadata("Επισκόπηση", "/dashboard");

type Props = { searchParams: Promise<{ welcome?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await getSession();
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
  const renewalStat = subscriptionRenewalStat(org?.subscription);

  return (
    <DashboardPageShell>
      <WelcomeTrialCard show={sp.welcome === "1"} trialEndsAt={trialEndsAt} trialPeriodDays={trialPeriodDays} />
      <DashboardPageHeader
        title={org?.name ?? "Επισκόπηση"}
        description={`Πλάνο: ${planLabel(planId)} · ${venueCount} ${venueCount === 1 ? DASHBOARD_EL.venue.toLowerCase() : DASHBOARD_EL.venues.toLowerCase()} · ${menuCount} ${menuCount === 1 ? "κατάλογος" : "κατάλογοι"} · ${itemCount} πιάτα`}
      />

      <TrialLimitsHint plan={planId} itemCount={itemCount} />

      <OnboardingWizard
        state={{
          hasVenue: venueCount > 0,
          hasCategory,
          hasItem: itemCount > 0,
          venueId: firstVenue?.id,
          venueSlug: firstVenue?.slug,
          itemCount,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label={DASHBOARD_EL.venues}
          value={venueCount}
          hint={venueCount === 0 ? "Πρόσθεσε το πρώτο" : undefined}
        />
        <DashboardStatCard
          label="Πιάτα"
          value={itemCount}
          hint={itemCount === 0 ? "Πρόσθεσε στον κατάλογο" : undefined}
        />
        <DashboardStatCard label={renewalStat.label} value={renewalStat.value} hint={renewalStat.hint} />
      </div>

      <div className={dashboardCardClass}>
        <h2 className="text-center font-semibold text-primary sm:text-left">Γρήγορες ενέργειες</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-relaxed text-slate-600 sm:mx-0 sm:text-left">
          {itemCount === 0
            ? "Ξεκίνα προσθέτοντας κατηγορίες και πιάτα — μετά βγάλε QR για τα τραπέζια σου."
            : "Ο κατάλογος σου είναι online! Βγάλε QR ή δες τις κλήσεις από πελάτες."}
        </p>
        <div className={cn(dashboardFormActionsClass, "mt-5 justify-center sm:justify-start")}>
          {venueCount === 0 ? (
            <Link href="/dashboard/venues/new" className={buttonClass("primary")}>
              + {DASHBOARD_EL.addVenue}
            </Link>
          ) : (
            <>
              <Link
                href={`/dashboard/menus${firstVenue ? `?venue=${firstVenue.id}` : ""}`}
                className={buttonClass("primary")}
              >
                {DASHBOARD_EL.editCatalog}
              </Link>
              <Link
                href={`/dashboard/qr${firstVenue ? `?venue=${firstVenue.id}` : ""}`}
                className={buttonClass("secondary")}
              >
                {DASHBOARD_EL.qrCodes}
              </Link>
              <Link href="/dashboard/waiter" className={buttonClass("secondary")}>
                {DASHBOARD_EL.calls} σερβιτόρου
              </Link>
              {firstVenue ? (
                <a
                  href={`/m/${firstVenue.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary")}
                >
                  {DASHBOARD_EL.livePreview}
                </a>
              ) : null}
            </>
          )}
          <Link href="/dashboard/billing" className={buttonClass("secondary")}>
            {DASHBOARD_EL.subscription}
          </Link>
        </div>
      </div>
    </DashboardPageShell>
  );
}

function subscriptionRenewalStat(
  sub: { plan: string; trialEndsAt: Date | null; currentPeriodEnd: Date | null } | null | undefined,
): { label: string; value: string; hint?: string } {
  if (!sub) return { label: "Συνδρομή", value: "—" };
  if (isTrialPlan(sub.plan) && sub.trialEndsAt) {
    return { label: DASHBOARD_EL.trial.endsOn, value: formatDateEl(sub.trialEndsAt) };
  }
  if (sub.currentPeriodEnd) {
    return { label: "Ανανέωση έως", value: formatDateEl(sub.currentPeriodEnd) };
  }
  return { label: "Πλάνο", value: planLabel(sub.plan) };
}

function formatDateEl(date: Date) {
  return date.toLocaleDateString("el-GR");
}
