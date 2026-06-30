import { prisma } from "@menuos/db";

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();
let lastMemoryCleanup = 0;

function checkRateLimitMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (now - lastMemoryCleanup > 60_000) {
    lastMemoryCleanup = now;
    for (const [bucketKey, entry] of memoryBuckets) {
      if (now > entry.resetAt) memoryBuckets.delete(bucketKey);
    }
  }

  const entry = memoryBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

async function checkRateLimitDb(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  return prisma.$transaction(async (tx) => {
    const row = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!row || row.resetAt <= now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return true;
    }

    if (row.count >= limit) return false;

    await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return true;
  });
}

/** Postgres-backed when available; in-memory fallback for local dev without migrations. */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    return await checkRateLimitDb(key, limit, windowMs);
  } catch {
    return checkRateLimitMemory(key, limit, windowMs);
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
