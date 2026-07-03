import { prisma } from "@menuos/db";
import { getPlan } from "@menuos/shared";
import { getPlanCatalogEntry } from "@/lib/plan-catalog-service";

export type GeminiOperation = "vision" | "translate";

export class GeminiQuotaExceededError extends Error {
  readonly usage: number;
  readonly limit: number;

  constructor(usage: number, limit: number) {
    super(`Gemini token quota exceeded (${usage}/${limit})`);
    this.name = "GeminiQuotaExceededError";
    this.usage = usage;
    this.limit = limit;
  }
}

export function startOfUtcMonth(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function extractGeminiUsage(data: unknown): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const meta = (data as {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  })?.usageMetadata;

  const inputTokens = Math.max(0, meta?.promptTokenCount ?? 0);
  const outputTokens = Math.max(0, meta?.candidatesTokenCount ?? 0);
  const totalTokens = Math.max(0, meta?.totalTokenCount ?? inputTokens + outputTokens);
  return { inputTokens, outputTokens, totalTokens };
}

export function formatGeminiTokenCount(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export async function getGeminiMonthlyUsage(organizationId: string, from = startOfUtcMonth()): Promise<number> {
  const agg = await prisma.geminiUsageEvent.aggregate({
    where: { organizationId, createdAt: { gte: from }, success: true },
    _sum: { totalTokens: true },
  });
  return agg._sum.totalTokens ?? 0;
}

export async function getGeminiMonthlyUsageByOrgIds(
  organizationIds: string[],
  from = startOfUtcMonth(),
): Promise<Map<string, number>> {
  if (organizationIds.length === 0) return new Map();
  const rows = await prisma.geminiUsageEvent.groupBy({
    by: ["organizationId"],
    where: {
      organizationId: { in: organizationIds },
      createdAt: { gte: from },
      success: true,
    },
    _sum: { totalTokens: true },
  });
  return new Map(rows.map((row) => [row.organizationId, row._sum.totalTokens ?? 0]));
}

export async function getTotalGeminiMonthlyUsage(from = startOfUtcMonth()): Promise<number> {
  const agg = await prisma.geminiUsageEvent.aggregate({
    where: { createdAt: { gte: from }, success: true },
    _sum: { totalTokens: true },
  });
  return agg._sum.totalTokens ?? 0;
}

export async function resolveGeminiTokenLimit(organizationId: string): Promise<number | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      geminiTokenLimitOverride: true,
      subscription: { select: { plan: true } },
    },
  });
  if (!org) return 0;

  if (org.geminiTokenLimitOverride != null) {
    return org.geminiTokenLimitOverride;
  }

  const planId = org.subscription?.plan ?? "TRIAL";
  const catalog = await getPlanCatalogEntry(planId);
  if (catalog && catalog.maxGeminiTokensPerMonth != null) {
    return catalog.maxGeminiTokensPerMonth;
  }

  return getPlan(planId).maxGeminiTokensPerMonth;
}

export async function assertGeminiTokenQuota(organizationId: string): Promise<void> {
  const limit = await resolveGeminiTokenLimit(organizationId);
  if (limit === null) return;
  const usage = await getGeminiMonthlyUsage(organizationId);
  if (usage >= limit) {
    throw new GeminiQuotaExceededError(usage, limit);
  }
}

export async function getGeminiUsageSummaries(organizationIds: string[]): Promise<
  Map<
    string,
    {
      usage: number;
      limit: number | null;
      override: number | null;
    }
  >
> {
  if (organizationIds.length === 0) return new Map();

  const [usageMap, orgs] = await Promise.all([
    getGeminiMonthlyUsageByOrgIds(organizationIds),
    prisma.organization.findMany({
      where: { id: { in: organizationIds } },
      select: {
        id: true,
        geminiTokenLimitOverride: true,
        subscription: { select: { plan: true } },
      },
    }),
  ]);

  const planLimitCache = new Map<string, number | null>();
  async function limitForPlan(planId: string): Promise<number | null> {
    if (planLimitCache.has(planId)) return planLimitCache.get(planId)!;
    const catalog = await getPlanCatalogEntry(planId);
    const limit = catalog?.maxGeminiTokensPerMonth ?? getPlan(planId).maxGeminiTokensPerMonth;
    planLimitCache.set(planId, limit);
    return limit;
  }

  const summaries = new Map<
    string,
    { usage: number; limit: number | null; override: number | null }
  >();

  for (const org of orgs) {
    const override = org.geminiTokenLimitOverride;
    const limit =
      override != null ? override : await limitForPlan(org.subscription?.plan ?? "TRIAL");
    summaries.set(org.id, {
      usage: usageMap.get(org.id) ?? 0,
      limit,
      override,
    });
  }

  return summaries;
}

export async function logGeminiUsageEvent(input: {
  organizationId: string;
  operation: GeminiOperation;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  success: boolean;
  httpStatus?: number;
}): Promise<void> {
  try {
    await prisma.geminiUsageEvent.create({
      data: {
        organizationId: input.organizationId,
        operation: input.operation,
        model: input.model,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens,
        totalTokens: input.totalTokens,
        success: input.success,
        httpStatus: input.httpStatus ?? null,
      },
    });
  } catch (err) {
    console.error("[gemini-usage] failed to log event", err);
  }
}
