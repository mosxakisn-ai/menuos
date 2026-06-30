import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@menuos/db";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import { getSession } from "@/lib/auth";
import { organizationHasActiveSubscription } from "@/lib/billing";
import { roleLabel } from "@/content/dashboard-el";

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

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <aside className="hidden w-64 shrink-0 bg-sidebar-gradient p-6 text-white md:block">
        <Logo href="/dashboard" dark showTagline markSize={36} />
        <p className="mt-2 text-xs text-slate-400">Διαχείριση menu</p>
        <DashboardSidebarNav initialPendingCount={pendingWaiterCount} />
        <div className="mt-auto pt-8">
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div>
            <p className="text-sm text-slate-500">Καλώς ήρθες</p>
            <p className="font-semibold text-primary">{session.name}</p>
          </div>
          <span className="rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
            {roleLabel(session.role)}
          </span>
        </header>
        <main className="flex-1 p-4 pb-24 sm:p-6 md:pb-6">{children}</main>
      </div>
      <DashboardMobileNav initialPendingCount={pendingWaiterCount} />
    </div>
  );
}
