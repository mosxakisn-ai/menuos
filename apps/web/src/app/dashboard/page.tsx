import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@menuos/db";
import { Card } from "@/components/ui/card";
import { buttonClass } from "@/components/ui/button";
import { getSession } from "@/lib/auth";
import { buildPrivatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPrivatePageMetadata("Dashboard", "/dashboard");

export default async function DashboardPage() {
  const session = await getSession();
  const org = await prisma.organization.findUnique({
    where: { id: session!.organizationId },
    include: {
      venues: { include: { menus: { include: { categories: true } } } },
      subscription: true,
    },
  });

  const venueCount = org?.venues.length ?? 0;
  const menuCount = org?.venues.reduce((n, v) => n + v.menus.length, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary">{org?.name}</h1>
        <p className="text-sm text-slate-600">
          Plan: {org?.subscription?.plan ?? "TRIAL"} · {venueCount} venue(s) · {menuCount} menu(s)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Venues" value={venueCount} />
        <StatCard label="Menus" value={menuCount} />
        <StatCard label="Trial ends" value={formatTrial(org?.subscription?.trialEndsAt)} />
      </div>

      <Card>
        <h2 className="font-semibold text-primary">Quick start</h2>
        <p className="mt-2 text-sm text-slate-600">
          Create your first venue and menu, then generate a QR code for your tables.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/venues/new" className={buttonClass("primary")}>
            Add venue
          </Link>
          <Link href="/dashboard/menus" className={buttonClass("secondary")}>
            Manage menus
          </Link>
          <Link href="/dashboard/billing" className={buttonClass("secondary")}>
            Upgrade plan
          </Link>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-serif text-2xl font-bold text-primary">{value}</p>
    </Card>
  );
}

function formatTrial(date?: Date | null) {
  if (!date) return "—";
  return date.toLocaleDateString("el-GR");
}
