import { prisma, type SubscriptionPlan, type SubscriptionStatus } from "@menuos/db";
import { DEMO_VENUE_SLUG, PLAN_DEFINITIONS, isPaidPlan, organizationHasPaidPlan } from "@menuos/shared";
import type { SupervisorOrganizationUpdateInput } from "@/lib/supervisor-schemas";

export type SupervisorOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  isDemo: boolean;
  adminEmail: string;
  adminName: string;
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
  venueCount: number;
  menuCount: number;
  itemCount: number;
};

export type SupervisorOverview = {
  organizations: number;
  organizationsReal: number;
  signupsLast7Days: number;
  signupsLast30Days: number;
  trialActive: number;
  paidActive: number;
  pastDue: number;
  canceled: number;
  trialsExpiring7Days: number;
  estimatedMrr: number;
  totalVenues: number;
  totalItems: number;
  byPlan: Record<string, number>;
};

async function demoOrganizationIds(): Promise<Set<string>> {
  const rows = await prisma.venue.findMany({
    where: { slug: DEMO_VENUE_SLUG },
    select: { organizationId: true },
  });
  return new Set(rows.map((r) => r.organizationId));
}

function countMenusAndItems(venues: {
  menus: { categories: { items: unknown[] }[] }[];
}[]) {
  let menuCount = 0;
  let itemCount = 0;
  for (const venue of venues) {
    menuCount += venue.menus.length;
    for (const menu of venue.menus) {
      for (const cat of menu.categories) {
        itemCount += cat.items.length;
      }
    }
  }
  return { menuCount, itemCount };
}

function mapOrganizationRow(
  org: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    users: { email: string; name: string; role: string; createdAt: Date }[];
    subscription: {
      plan: string;
      status: string;
      trialEndsAt: Date | null;
      currentPeriodEnd: Date | null;
      stripeCustomerId: string | null;
      stripeSubId: string | null;
    } | null;
    venues: { menus: { categories: { items: unknown[] }[] }[] }[];
  },
  isDemo: boolean,
): SupervisorOrganizationRow {
  const admin =
    org.users.find((u) => u.role === "ADMIN") ??
    [...org.users].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  const { menuCount, itemCount } = countMenusAndItems(org.venues);

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    createdAt: org.createdAt.toISOString(),
    isDemo,
    adminEmail: admin?.email ?? "—",
    adminName: admin?.name ?? "—",
    plan: org.subscription?.plan ?? "TRIAL",
    status: org.subscription?.status ?? "TRIALING",
    trialEndsAt: org.subscription?.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: org.subscription?.currentPeriodEnd?.toISOString() ?? null,
    stripeCustomerId: org.subscription?.stripeCustomerId ?? null,
    stripeSubId: org.subscription?.stripeSubId ?? null,
    venueCount: org.venues.length,
    menuCount,
    itemCount,
  };
}

const orgInclude = {
  users: {
    select: { email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" as const },
  },
  subscription: true,
  venues: {
    select: {
      menus: {
        select: {
          categories: { select: { items: { select: { id: true } } } },
        },
      },
    },
  },
} as const;

export async function getSupervisorOverview(): Promise<SupervisorOverview> {
  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const trialExpiring = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const demoIds = await demoOrganizationIds();

  const [orgs, subs, venuesCount, itemsCount] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      select: { organizationId: true, plan: true, status: true, trialEndsAt: true },
    }),
    prisma.venue.count({ where: { organizationId: { notIn: [...demoIds] } } }),
    prisma.item.count({
      where: { category: { menu: { venue: { organizationId: { notIn: [...demoIds] } } } } },
    }),
  ]);

  const realOrgs = orgs.filter((o) => !demoIds.has(o.id));
  const realSubs = subs.filter((s) => !demoIds.has(s.organizationId));

  const byPlan: Record<string, number> = {};
  for (const sub of realSubs) {
    byPlan[sub.plan] = (byPlan[sub.plan] ?? 0) + 1;
  }

  let estimatedMrr = 0;
  let paidActive = 0;
  let trialActive = 0;
  let pastDue = 0;
  let canceled = 0;
  let trialsExpiring7Days = 0;

  for (const sub of realSubs) {
    const active = organizationHasPaidPlan({
      plan: sub.plan,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
    });

    if (sub.status === "CANCELED") canceled += 1;
    else if (sub.status === "PAST_DUE") pastDue += 1;
    else if (sub.plan === "TRIAL" && active) trialActive += 1;
    else if (active && sub.plan !== "TRIAL") {
      paidActive += 1;
      const price = PLAN_DEFINITIONS[sub.plan as keyof typeof PLAN_DEFINITIONS]?.priceMonthly ?? 0;
      estimatedMrr += price;
    }

    if (
      sub.plan === "TRIAL" &&
      sub.trialEndsAt &&
      sub.trialEndsAt > now &&
      sub.trialEndsAt <= trialExpiring
    ) {
      trialsExpiring7Days += 1;
    }
  }

  return {
    organizations: orgs.length,
    organizationsReal: realOrgs.length,
    signupsLast7Days: realOrgs.filter((o) => o.createdAt >= day7).length,
    signupsLast30Days: realOrgs.filter((o) => o.createdAt >= day30).length,
    trialActive,
    paidActive,
    pastDue,
    canceled,
    trialsExpiring7Days,
    estimatedMrr: Math.round(estimatedMrr * 100) / 100,
    totalVenues: venuesCount,
    totalItems: itemsCount,
    byPlan,
  };
}

export async function listOrganizationsForSupervisor(input?: {
  search?: string;
  plan?: string;
  status?: string;
  limit?: number;
}): Promise<SupervisorOrganizationRow[]> {
  const demoIds = await demoOrganizationIds();
  const search = input?.search?.trim().toLowerCase();
  const limit = Math.min(input?.limit ?? 500, 500);

  const orgs = await prisma.organization.findMany({
    include: orgInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  let rows = orgs.map((org) => mapOrganizationRow(org, demoIds.has(org.id)));

  if (search) {
    rows = rows.filter((row) =>
      [row.name, row.slug, row.adminEmail, row.adminName].some((v) =>
        v.toLowerCase().includes(search),
      ),
    );
  }
  if (input?.plan) {
    rows = rows.filter((row) => row.plan.toUpperCase() === input.plan!.toUpperCase());
  }
  if (input?.status) {
    rows = rows.filter((row) => row.status.toUpperCase() === input.status!.toUpperCase());
  }

  return rows;
}

export async function getOrganizationForSupervisor(
  id: string,
): Promise<SupervisorOrganizationRow | null> {
  const demoIds = await demoOrganizationIds();
  const org = await prisma.organization.findUnique({
    where: { id },
    include: orgInclude,
  });
  if (!org) return null;
  return mapOrganizationRow(org, demoIds.has(org.id));
}

export async function updateOrganizationForSupervisor(
  id: string,
  input: SupervisorOrganizationUpdateInput,
): Promise<SupervisorOrganizationRow> {
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) throw new Error("not_found");

  const now = new Date();
  const data: {
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
    trialEndsAt?: Date | null;
    currentPeriodEnd?: Date | null;
  } = {};

  if (input.grantProMonths) {
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + input.grantProMonths);
    data.plan = "PRO";
    data.status = "ACTIVE";
    data.trialEndsAt = null;
    data.currentPeriodEnd = periodEnd;
  } else {
    if (input.plan) data.plan = input.plan as SubscriptionPlan;
    if (input.status) data.status = input.status as SubscriptionStatus;
    if (input.extendTrialDays) {
      const sub = await prisma.subscription.findUnique({ where: { organizationId: id } });
      if (sub && sub.plan !== "TRIAL" && isPaidPlan(sub.plan)) {
        throw new Error("extend_trial_not_allowed");
      }
      const base = sub?.trialEndsAt && sub.trialEndsAt > now ? sub.trialEndsAt : now;
      const extended = new Date(base.getTime() + input.extendTrialDays * 24 * 60 * 60 * 1000);
      data.plan = "TRIAL";
      data.status = "TRIALING";
      data.trialEndsAt = extended;
    } else if (data.plan === "TRIAL") {
      const sub = await prisma.subscription.findUnique({ where: { organizationId: id } });
      const trialValid = sub?.trialEndsAt && sub.trialEndsAt > now;
      if (!trialValid) {
        data.trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      if (!data.status) data.status = "TRIALING";
    }
  }

  await prisma.subscription.upsert({
    where: { organizationId: id },
    create: {
      organizationId: id,
      plan: data.plan ?? "TRIAL",
      status: data.status ?? "TRIALING",
      trialEndsAt: data.trialEndsAt ?? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: data.currentPeriodEnd ?? null,
    },
    update: data,
  });

  const updated = await getOrganizationForSupervisor(id);
  if (!updated) throw new Error("not_found");
  return updated;
}
