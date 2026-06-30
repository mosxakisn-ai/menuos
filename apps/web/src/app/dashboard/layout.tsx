import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@menuos/db";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardSidebarBrand } from "@/components/dashboard/dashboard-sidebar-brand";
import { DashboardSidebarSubscription } from "@/components/dashboard/dashboard-sidebar-subscription";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { TrialStatusBanner } from "@/components/dashboard/trial-status-banner";
import { getSession } from "@/lib/auth";
import { isTrialPlan, isTrialStillActive } from "@menuos/shared";
import { organizationHasActiveSubscription } from "@/lib/billing";
import { formatSubscriptionSummary } from "@/lib/subscription-display";
import { roleLabel } from "@/content/dashboard-el";
import { resolveBusinessDisplay } from "@/lib/business-display";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const headersList = await headers();
  if (headersList.get("x-menuos-check-subscription") === "1") {
    const active = await organizationHasActiveSubscription(session.organizationId);
    if (!active) {
      redirect("/dashboard/billing?inactive=1");
    }
  }

  const pendingWaiterCount = await prisma.waiterCall.count({
    where: {
      venue: { organizationId: session.organizationId },
      status: "PENDING",
    },
  });

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
  const subscriptionSummary = formatSubscriptionSummary(subscription);
  const showTrialBanner =
    subscription?.plan &&
    isTrialPlan(subscription.plan) &&
    subscription.trialEndsAt &&
    isTrialStillActive(subscription.trialEndsAt);
  const trialEndsAtIso = subscription?.trialEndsAt?.toISOString() ?? null;

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-sidebar-gradient p-6 text-white md:flex">
        <Logo href="/dashboard" dark showTagline markSize={36} />
        <p className="mt-2 text-xs text-slate-400">Διαχείριση menu</p>
        {org ? (
          <DashboardSidebarBrand organizationName={business.name} logoUrl={business.logoUrl} />
        ) : null}
        <div className="mt-8 flex min-h-0 flex-1 flex-col">
          <DashboardSidebarNav initialPendingCount={pendingWaiterCount} />
        </div>
        {org ? <DashboardSidebarSubscription subscription={subscription} /> : null}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[5rem] items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 py-3">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logoUrl}
                alt=""
                className="hidden h-11 w-11 shrink-0 rounded-xl border border-slate-200/80 bg-slate-50 object-cover sm:block"
              />
            ) : null}
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Καλώς ήρθες</p>
              <p className="truncate text-lg font-semibold leading-snug text-primary">{business.name}</p>
              <p className="truncate text-sm leading-relaxed text-slate-500">
                {session.name !== business.name ? (
                  <>
                    <span className="text-slate-600">{session.name}</span>
                    <span className="text-slate-300"> · </span>
                  </>
                ) : null}
                {session.email}
              </p>
              {org && subscriptionSummary.expiryLine ? (
                <p className="flex items-center gap-1.5 truncate text-xs text-slate-400 md:hidden">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      subscriptionSummary.active ? "bg-emerald-500" : "bg-red-500",
                    )}
                    aria-hidden
                  />
                  {subscriptionSummary.expiryLine}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue sm:inline-flex">
              {roleLabel(session.role)}
            </span>
            <LogoutButton variant="header" />
          </div>
        </header>
        <main className="flex-1 bg-brand-surface/50 p-4 pb-24 sm:p-6 md:pb-8">
          {showTrialBanner && trialEndsAtIso ? (
            <div className="mx-auto mb-6 w-full max-w-5xl">
              <TrialStatusBanner trialEndsAt={trialEndsAtIso} />
            </div>
          ) : null}
          {children}
        </main>
      </div>
      <DashboardMobileNav initialPendingCount={pendingWaiterCount} />
    </div>
  );
}
