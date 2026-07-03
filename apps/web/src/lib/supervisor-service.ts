import { prisma, type SubscriptionPlan, type SubscriptionStatus } from "@menuos/db";
import {
  DEMO_VENUE_SLUG,
  getPlan,
  isPaidPlan,
  organizationHasPaidPlan,
  type OrganizationActivity,
} from "@menuos/shared";
import { getPlanPriceMap, getTrialDaysFromCatalog } from "@/lib/plan-catalog-service";
import { getGeminiUsageSummaries, getTotalGeminiMonthlyUsage } from "@/lib/gemini-usage-service";
import type { SupervisorOrganizationUpdateInput } from "@/lib/supervisor-schemas";

export type SupervisorOrganizationUser = {
  name: string;
  email: string;
  role: string;
};

export type SupervisorOrganizationVenue = {
  id: string;
  name: string;
  slug: string;
};

export type SupervisorOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  mobile: string | null;
  vatNumber: string | null;
  activity: OrganizationActivity | null;
  city: string | null;
  notes: string | null;
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
  geminiTokensThisMonth: number;
  geminiTokenLimit: number | null;
  geminiTokenLimitOverride: number | null;
  venues: SupervisorOrganizationVenue[];
  users: SupervisorOrganizationUser[];
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
  geminiTokensThisMonth: number;
  byPlan: Record<string, number>;
};

async function demoOrganizationIds(): Promise<Set<string>> {
  const rows = await prisma.venue.findMany({
    where: { slug: DEMO_VENUE_SLUG },
    select: { organizationId: true },
  });
  return new Set(rows.map((r) => r.organizationId));
}

function excludeDemoOrganizations(demoIds: Set<string>) {
  const ids = [...demoIds];
  return ids.length > 0 ? { organizationId: { notIn: ids } } : {};
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

function pickPrimaryOrgUser<T extends { role: string; createdAt: Date }>(users: T[]): T | undefined {
  return (
    users.find((u) => u.role === "ADMIN") ??
    [...users].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
  );
}

function addCalendarMonths(from: Date, months: number): Date {
  const result = new Date(from);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function mapOrganizationRow(
  org: {
    id: string;
    name: string;
    slug: string;
    phone: string | null;
    mobile: string | null;
    vatNumber: string | null;
    activity: OrganizationActivity | null;
    city: string | null;
    notes: string | null;
    geminiTokenLimitOverride: number | null;
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
    venues: {
      id: string;
      name: string;
      slug: string;
      menus: { categories: { items: unknown[] }[] }[];
    }[];
  },
  isDemo: boolean,
  gemini?: { usage: number; limit: number | null; override: number | null },
): SupervisorOrganizationRow {
  const admin = pickPrimaryOrgUser(org.users);
  const { menuCount, itemCount } = countMenusAndItems(org.venues);

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    phone: org.phone,
    mobile: org.mobile,
    vatNumber: org.vatNumber,
    activity: org.activity,
    city: org.city,
    notes: org.notes,
    geminiTokensThisMonth: gemini?.usage ?? 0,
    geminiTokenLimit: gemini?.limit ?? null,
    geminiTokenLimitOverride: gemini?.override ?? org.geminiTokenLimitOverride,
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
    venues: org.venues.map((v) => ({ id: v.id, name: v.name, slug: v.slug })),
    users: org.users.map((u) => ({ name: u.name, email: u.email, role: u.role })),
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
      id: true,
      name: true,
      slug: true,
      menus: {
        select: {
          categories: { select: { items: { select: { id: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} as const;

export async function getSupervisorOverview(): Promise<SupervisorOverview> {
  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const trialExpiring = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const demoIds = await demoOrganizationIds();
  const excludeDemo = excludeDemoOrganizations(demoIds);

  const [orgs, subs, venuesCount, itemsCount, geminiTokensThisMonth] = await Promise.all([
    prisma.organization.findMany({
      select: { id: true, createdAt: true },
    }),
    prisma.subscription.findMany({
      select: { organizationId: true, plan: true, status: true, trialEndsAt: true },
    }),
    prisma.venue.count({ where: excludeDemo }),
    prisma.item.count({
      where: { category: { menu: { venue: excludeDemo } } },
    }),
    getTotalGeminiMonthlyUsage(),
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
  const planPrices = await getPlanPriceMap();

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
      const price = planPrices[sub.plan] ?? 0;
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
    geminiTokensThisMonth,
    byPlan,
  };
}

async function attachGeminiSummaries(rows: SupervisorOrganizationRow[]): Promise<SupervisorOrganizationRow[]> {
  const summaries = await getGeminiUsageSummaries(rows.map((row) => row.id));
  return rows.map((row) => {
    const summary = summaries.get(row.id);
    if (!summary) return row;
    return {
      ...row,
      geminiTokensThisMonth: summary.usage,
      geminiTokenLimit: summary.limit,
      geminiTokenLimitOverride: summary.override,
    };
  });
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
      [
        row.name,
        row.slug,
        row.adminEmail,
        row.adminName,
        row.phone,
        row.mobile,
        row.vatNumber,
        row.city,
      ].some((v) => v?.toLowerCase().includes(search)),
    );
  }
  if (input?.plan) {
    rows = rows.filter((row) => row.plan.toUpperCase() === input.plan!.toUpperCase());
  }
  if (input?.status) {
    rows = rows.filter((row) => row.status.toUpperCase() === input.status!.toUpperCase());
  }

  return attachGeminiSummaries(rows);
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
  const row = mapOrganizationRow(org, demoIds.has(org.id));
  const [enriched] = await attachGeminiSummaries([row]);
  return enriched ?? row;
}

export async function updateOrganizationForSupervisor(
  id: string,
  input: SupervisorOrganizationUpdateInput,
): Promise<SupervisorOrganizationRow> {
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) throw new Error("not_found");

  const profileData: {
    name?: string;
    phone?: string | null;
    mobile?: string | null;
    vatNumber?: string | null;
    activity?: OrganizationActivity | null;
    city?: string | null;
    notes?: string | null;
    geminiTokenLimitOverride?: number | null;
  } = {};
  if (input.name !== undefined) profileData.name = input.name;
  if (input.phone !== undefined) profileData.phone = input.phone;
  if (input.mobile !== undefined) profileData.mobile = input.mobile;
  if (input.vatNumber !== undefined) profileData.vatNumber = input.vatNumber;
  if (input.activity !== undefined) profileData.activity = input.activity;
  if (input.city !== undefined) profileData.city = input.city;
  if (input.notes !== undefined) profileData.notes = input.notes;
  if (input.geminiTokenLimitOverride !== undefined) {
    profileData.geminiTokenLimitOverride = input.geminiTokenLimitOverride;
  }

  if (Object.keys(profileData).length > 0) {
    await prisma.organization.update({ where: { id }, data: profileData });
  }

  if (input.adminEmail !== undefined) {
    const normalizedEmail = input.adminEmail.trim().toLowerCase();
    const users = await prisma.user.findMany({
      where: { organizationId: id },
      orderBy: { createdAt: "asc" },
    });
    const primary = pickPrimaryOrgUser(users);
    if (!primary) throw new Error("no_user");
    if (primary.email !== normalizedEmail) {
      const taken = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (taken) throw new Error("email_taken");
      await prisma.user.update({ where: { id: primary.id }, data: { email: normalizedEmail } });
    }
  }

  const hasSubscriptionPatch =
    input.plan !== undefined ||
    input.status !== undefined ||
    input.extendTrialDays !== undefined ||
    input.grantProMonths !== undefined ||
    input.currentPeriodEnd !== undefined;

  if (!hasSubscriptionPatch) {
    const updated = await getOrganizationForSupervisor(id);
    if (!updated) throw new Error("not_found");
    return updated;
  }

  const now = new Date();
  const data: {
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
    trialEndsAt?: Date | null;
    currentPeriodEnd?: Date | null;
  } = {};

  if (input.grantProMonths) {
    const periodEnd = addCalendarMonths(now, input.grantProMonths);
    data.plan = "PRO";
    data.status = "ACTIVE";
    data.trialEndsAt = null;
    data.currentPeriodEnd = periodEnd;
  } else if (input.currentPeriodEnd) {
    const periodEnd = new Date(`${input.currentPeriodEnd}T23:59:59.999Z`);
    if (!Number.isFinite(periodEnd.getTime())) {
      throw new Error("invalid_period_end");
    }
    data.trialEndsAt = null;
    data.currentPeriodEnd = periodEnd;
    if (!data.plan) {
      const sub = await prisma.subscription.findUnique({ where: { organizationId: id } });
      if (sub?.plan && sub.plan !== "TRIAL") {
        data.plan = sub.plan;
      } else {
        data.plan = "PRO";
      }
    }
    if (!data.status) data.status = "ACTIVE";
  } else {
    if (input.plan) data.plan = input.plan as SubscriptionPlan;
    if (input.status) data.status = input.status as SubscriptionStatus;
    if (input.plan && input.plan !== "TRIAL") {
      data.trialEndsAt = null;
      const sub = await prisma.subscription.findUnique({ where: { organizationId: id } });
      if (!sub?.currentPeriodEnd && input.plan !== "ENTERPRISE") {
        data.currentPeriodEnd = addCalendarMonths(now, 1);
      }
    }
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
      data.currentPeriodEnd = null;
    } else if (data.plan === "TRIAL") {
      const sub = await prisma.subscription.findUnique({ where: { organizationId: id } });
      const trialValid = sub?.trialEndsAt && sub.trialEndsAt > now;
      if (!trialValid) {
        const trialDays = await getTrialDaysFromCatalog();
        data.trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      }
      if (!data.status) data.status = "TRIALING";
      data.currentPeriodEnd = null;
    }
  }

  const defaultTrialDays = await getTrialDaysFromCatalog();

  await prisma.subscription.upsert({
    where: { organizationId: id },
    create: {
      organizationId: id,
      plan: data.plan ?? "TRIAL",
      status: data.status ?? "TRIALING",
      trialEndsAt: data.trialEndsAt ?? new Date(now.getTime() + defaultTrialDays * 24 * 60 * 60 * 1000),
      currentPeriodEnd: data.currentPeriodEnd ?? null,
    },
    update: data,
  });

  const updated = await getOrganizationForSupervisor(id);
  if (!updated) throw new Error("not_found");
  return updated;
}

export type SupervisorGeminiRow = {
  id: string;
  name: string;
  adminEmail: string;
  plan: string;
  status: string;
  geminiTokensThisMonth: number;
  /** Effective limit (override or plan default). null = unlimited. */
  geminiTokenLimit: number | null;
  geminiTokenLimitOverride: number | null;
  /** Default limit from plan catalog, before per-customer override. */
  planDefaultLimit: number | null;
};

export async function listGeminiRowsForSupervisor(): Promise<SupervisorGeminiRow[]> {
  const demoIds = await demoOrganizationIds();
  const orgs = await prisma.organization.findMany({
    where: demoIds.size > 0 ? { id: { notIn: [...demoIds] } } : {},
    select: {
      id: true,
      name: true,
      geminiTokenLimitOverride: true,
      users: {
        where: { role: "ADMIN" },
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { email: true },
      },
      subscription: { select: { plan: true, status: true } },
    },
    orderBy: { name: "asc" },
  });

  const summaries = await getGeminiUsageSummaries(orgs.map((org) => org.id));

  return orgs.map((org) => {
    const plan = org.subscription?.plan ?? "TRIAL";
    const summary = summaries.get(org.id);
    const planDefaultLimit = getPlan(plan).maxGeminiTokensPerMonth;

    return {
      id: org.id,
      name: org.name,
      adminEmail: org.users[0]?.email ?? "—",
      plan,
      status: org.subscription?.status ?? "TRIALING",
      geminiTokensThisMonth: summary?.usage ?? 0,
      geminiTokenLimit: summary?.limit ?? planDefaultLimit,
      geminiTokenLimitOverride: summary?.override ?? org.geminiTokenLimitOverride,
      planDefaultLimit,
    };
  });
}
