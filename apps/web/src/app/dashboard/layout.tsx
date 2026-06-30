import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@menuos/db";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardSidebarBrand } from "@/components/dashboard/dashboard-sidebar-brand";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { getSession } from "@/lib/auth";
import { organizationHasActiveSubscription } from "@/lib/billing";
import { formatSubscriptionSummary } from "@/lib/subscription-display";
import { roleLabel } from "@/content/dashboard-el";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const headersList = await headers();
  if (headersList.get("x-menuos-check-subscription") === "1") {
    const active = await organizationHasActiveSubscription(session.organizationId);
    if (!active) {
      redirect("/dashboard/billing?trial=expired");
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
        select: { logoUrl: true },
        orderBy: { createdAt: "asc" },
        take: 5,
      },
    },
  });

  const businessLogoUrl = org?.venues.find((v) => v.logoUrl)?.logoUrl ?? null;
  const subscription = org?.subscription
    ? {
        plan: org.subscription.plan,
        status: org.subscription.status,
        trialEndsAt: org.subscription.trialEndsAt,
        currentPeriodEnd: org.subscription.currentPeriodEnd,
      }
    : null;
  const subscriptionSummary = formatSubscriptionSummary(subscription);

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar-gradient p-6 text-white md:flex">
        <Logo href="/dashboard" dark showTagline markSize={36} />
        <p className="mt-2 text-xs text-slate-400">Διαχείριση menu</p>
        {org ? (
          <DashboardSidebarBrand
            organizationName={org.name}
            logoUrl={businessLogoUrl}
            subscription={subscription}
          />
        ) : null}
        <DashboardSidebarNav initialPendingCount={pendingWaiterCount} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-2 sm:px-6 sm:py-0">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Καλώς ήρθες</p>
            <p className="truncate font-semibold text-primary">{session.name}</p>
            {org ? (
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500 md:hidden">
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    subscriptionSummary.active ? "bg-emerald-500" : "bg-red-500",
                  )}
                  aria-hidden
                />
                <span className="truncate">{org.name}</span>
                {subscriptionSummary.expiryLine ? (
                  <span className="shrink-0 text-slate-400">· {subscriptionSummary.expiryLine}</span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue sm:inline-flex">
              {roleLabel(session.role)}
            </span>
            <LogoutButton variant="header" />
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</main>
      </div>
      <DashboardMobileNav initialPendingCount={pendingWaiterCount} />
    </div>
  );
}
