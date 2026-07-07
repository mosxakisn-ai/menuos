import { prisma } from "@menuos/db";
import { checkRateLimitOutcome } from "@/lib/rate-limit";
import { startOfTodayAthens } from "@/lib/athens-day";

export const VISITOR_INTENT_SURFACES = ["marketing", "register", "checkout"] as const;
export type VisitorIntentSurface = (typeof VISITOR_INTENT_SURFACES)[number];

export const VISITOR_INTENT_STEPS = [
  "browse",
  "pricing",
  "register_start",
  "register_otp",
  "checkout_opened",
  "pay_clicked",
  "stripe_redirect",
  "payment_success",
  "payment_cancelled",
  "payment_failed",
  "stripe_init_failed",
  "heartbeat",
  "session_end",
] as const;
export type VisitorIntentStep = (typeof VISITOR_INTENT_STEPS)[number];

export const VISITOR_INTENT_ACTIVE_WITHIN_SECONDS = 180;
export const VISITOR_INTENT_STUCK_STEP_SECONDS = 120;
export const VISITOR_INTENT_LOG_HOURS = 24;
export const VISITOR_INTENT_RETENTION_HOURS = 48;

const HOT_STEPS = new Set<VisitorIntentStep>([
  "pricing",
  "register_start",
  "register_otp",
  "checkout_opened",
  "pay_clicked",
  "stripe_redirect",
  "payment_success",
  "payment_cancelled",
  "payment_failed",
  "stripe_init_failed",
]);

const STUCK_STEPS = new Set<VisitorIntentStep>([
  "checkout_opened",
  "pay_clicked",
  "stripe_redirect",
  "register_otp",
]);

const FINAL_STEPS = new Set<VisitorIntentStep>([
  "payment_success",
  "payment_cancelled",
  "payment_failed",
  "stripe_init_failed",
]);

/** Higher = further in funnel — used to avoid step downgrades on navigation. */
export const VISITOR_INTENT_STEP_RANK: Partial<Record<VisitorIntentStep, number>> = {
  browse: 1,
  pricing: 2,
  register_start: 3,
  register_otp: 4,
  checkout_opened: 5,
  pay_clicked: 6,
  stripe_redirect: 7,
  payment_cancelled: 7,
  payment_failed: 7,
  stripe_init_failed: 7,
  payment_success: 10,
};

function stepRank(step: VisitorIntentStep | string | undefined): number {
  if (!step || step === "heartbeat" || step === "session_end") return 0;
  return VISITOR_INTENT_STEP_RANK[step as VisitorIntentStep] ?? 0;
}

export function peakFunnelStep(row: {
  step: VisitorIntentStep | string;
  stepTrail?: VisitorIntentStepTrailEntry[] | null;
}): VisitorIntentStep | string {
  const candidates = [
    ...(row.stepTrail ?? []).map((t) => t.step),
    row.step,
  ].filter((s) => s && s !== "heartbeat" && s !== "session_end");
  return candidates.reduce(
    (best, s) => (stepRank(s) >= stepRank(best) ? s : best),
    "browse",
  );
}

function resolveStepTransition(
  prev: VisitorIntentStep | undefined,
  incoming: VisitorIntentStep,
  opts?: { surface?: VisitorIntentSurface; prevSurface?: VisitorIntentSurface },
): VisitorIntentStep {
  if (incoming === "session_end") return incoming;
  if (incoming === "heartbeat") return prev ?? "browse";
  if (!prev) return incoming;
  if (
    opts?.surface === "marketing" &&
    (incoming === "browse" || incoming === "pricing") &&
    opts.prevSurface &&
    (opts.prevSurface === "checkout" || opts.prevSurface === "register")
  ) {
    return incoming;
  }
  if (FINAL_STEPS.has(prev) && !FINAL_STEPS.has(incoming)) return prev;
  if (stepRank(incoming) >= stepRank(prev)) return incoming;
  return prev;
}

const INFRA_IPS = new Set([
  "127.0.0.1",
  "::1",
  "::ffff:127.0.0.1",
  "46.225.40.218",
  "::ffff:46.225.40.218",
  "188.34.195.62",
]);

const geoCache = new Map<string, { country: string; city: string; expires: number }>();

export type VisitorIntentStepTrailEntry = { step: string; at: number };

export type VisitorIntentRow = {
  sessionId: string;
  surface: VisitorIntentSurface;
  step: VisitorIntentStep;
  path: string | null;
  planId: string | null;
  visitorLabel: string | null;
  clientIp: string | null;
  ipCity: string | null;
  ipCountry: string | null;
  referrer: string | null;
  source: string;
  status: "online" | "left";
  stepSince: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  leftAt: Date | null;
  stepTrail: VisitorIntentStepTrailEntry[];
  stepSeconds?: number;
  stuck?: boolean;
  durationSeconds?: number;
};

function normalizeSid(raw: string | null | undefined): string | null {
  const sid = (raw ?? "").trim().toLowerCase();
  if (!sid || sid.length < 8 || sid.length > 64) return null;
  if (!/^[a-z0-9-]+$/.test(sid)) return null;
  if (/^(test-|bugcheck-)/.test(sid)) return null;
  return sid;
}

function normalizeIp(raw: string | null | undefined): string {
  let ip = (raw ?? "").trim().slice(0, 45);
  if (ip.toLowerCase().startsWith("::ffff:")) ip = ip.slice(7);
  return ip;
}

function pickClientIp(...candidates: (string | null | undefined)[]): string {
  let ipv6 = "";
  for (const raw of candidates) {
    if (!raw) continue;
    for (const part of String(raw).split(",")) {
      const ip = normalizeIp(part);
      if (!ip || INFRA_IPS.has(ip)) continue;
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
      if (!ipv6) ipv6 = ip;
    }
  }
  return ipv6;
}

async function lookupIpGeo(ip: string): Promise<{ country: string; city: string }> {
  const norm = normalizeIp(ip);
  if (!norm || INFRA_IPS.has(norm)) return { country: "", city: "" };
  const cached = geoCache.get(norm);
  if (cached && cached.expires > Date.now()) {
    return { country: cached.country, city: cached.city };
  }
  let country = "";
  let city = "";
  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(norm)}?fields=status,country,city`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MenuOS/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    const data = (await res.json()) as { status?: string; country?: string; city?: string };
    if (data.status === "success") {
      country = String(data.country ?? "").trim().slice(0, 80);
      city = String(data.city ?? "").trim().slice(0, 80);
    }
  } catch {
    /* best effort */
  }
  geoCache.set(norm, { country, city, expires: Date.now() + 86_400_000 });
  return { country, city };
}

function appendStepTrail(
  existing: VisitorIntentStepTrailEntry[] | null | undefined,
  step: VisitorIntentStep,
  atMs: number,
): VisitorIntentStepTrailEntry[] {
  if (step === "heartbeat") return existing ?? [];
  const label = step;
  const trail = [...(existing ?? [])];
  const last = trail[trail.length - 1];
  if (last?.step === label) {
    trail[trail.length - 1] = { step: label, at: atMs };
  } else {
    trail.push({ step: label, at: atMs });
  }
  return trail.slice(-20);
}

function enrichLiveRow(row: VisitorIntentRow, now: Date): VisitorIntentRow {
  const effectiveStep = peakFunnelStep(row) as VisitorIntentStep;
  const stepSeconds = Math.max(0, Math.floor((now.getTime() - row.stepSince.getTime()) / 1000));
  const stuck =
    (STUCK_STEPS.has(row.step) || STUCK_STEPS.has(effectiveStep)) &&
    stepSeconds >= VISITOR_INTENT_STUCK_STEP_SECONDS;
  return { ...row, stepSeconds, stuck };
}

async function enrichRowsWithGeo(rows: VisitorIntentRow[]): Promise<VisitorIntentRow[]> {
  const out: VisitorIntentRow[] = [];
  for (const row of rows) {
    if (row.clientIp && (!row.ipCity || !row.ipCountry)) {
      const geo = await lookupIpGeo(row.clientIp);
      out.push({
        ...row,
        ipCity: geo.city || row.ipCity,
        ipCountry: geo.country || row.ipCountry,
      });
    } else {
      out.push(row);
    }
  }
  return out;
}

function enrichLogRow(row: VisitorIntentRow, now: Date, liveSids: Set<string>): VisitorIntentRow {
  const first = row.firstSeenAt.getTime();
  const last = row.lastSeenAt.getTime();
  const online = liveSids.has(row.sessionId);
  const leftAt = online ? null : row.leftAt ?? row.lastSeenAt;
  const end = leftAt?.getTime() ?? last;
  let durationSeconds = Math.max(0, Math.floor((end - first) / 1000));
  durationSeconds = Math.min(durationSeconds, 6 * 3600);
  const stepSeconds = online
    ? Math.max(0, Math.floor((now.getTime() - row.stepSince.getTime()) / 1000))
    : durationSeconds;
  return {
    ...row,
    status: online ? "online" : "left",
    leftAt,
    durationSeconds,
    stepSeconds,
    stuck:
      online &&
      (STUCK_STEPS.has(row.step) || STUCK_STEPS.has(peakFunnelStep(row) as VisitorIntentStep)) &&
      stepSeconds >= VISITOR_INTENT_STUCK_STEP_SECONDS,
  };
}

/** Κλείνει sessions χωρίς heartbeat > active window — σταματάει ο χρόνος επίσκεψης. */
export async function markStaleVisitorSessionsLeft(
  now = new Date(),
  activeWithinSeconds = VISITOR_INTENT_ACTIVE_WITHIN_SECONDS,
): Promise<number> {
  const cutoff = new Date(now.getTime() - activeWithinSeconds * 1000);
  const result = await prisma.$executeRaw`
    UPDATE "VisitorIntentSession"
    SET status = 'left', "leftAt" = COALESCE("leftAt", "lastSeenAt")
    WHERE status = 'online' AND "lastSeenAt" < ${cutoff}
  `;
  return Number(result);
}

function rowFromDb(row: {
  sessionId: string;
  surface: string;
  step: string;
  path: string | null;
  planId: string | null;
  visitorLabel: string | null;
  clientIp: string | null;
  ipCity: string | null;
  ipCountry: string | null;
  referrer: string | null;
  source: string;
  status: string;
  stepSince: Date;
  firstSeenAt: Date;
  lastSeenAt: Date;
  leftAt: Date | null;
  stepTrail: unknown;
}): VisitorIntentRow {
  return {
    sessionId: row.sessionId,
    surface: row.surface as VisitorIntentSurface,
    step: row.step as VisitorIntentStep,
    path: row.path,
    planId: row.planId,
    visitorLabel: row.visitorLabel,
    clientIp: row.clientIp,
    ipCity: row.ipCity,
    ipCountry: row.ipCountry,
    referrer: row.referrer,
    source: row.source,
    status: row.status === "left" ? "left" : "online",
    stepSince: row.stepSince,
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    leftAt: row.leftAt,
    stepTrail: Array.isArray(row.stepTrail)
      ? (row.stepTrail as VisitorIntentStepTrailEntry[])
      : [],
  };
}

export async function pruneOldVisitorIntentSessions(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - VISITOR_INTENT_RETENTION_HOURS * 3600 * 1000);
  const result = await prisma.visitorIntentSession.deleteMany({
    where: { lastSeenAt: { lt: cutoff } },
  });
  return result.count;
}

export async function recordVisitorIntent(input: {
  sessionId: string;
  surface: VisitorIntentSurface;
  step: VisitorIntentStep;
  path?: string | null;
  planId?: string | null;
  visitorLabel?: string | null;
  clientIp?: string | null;
  referrer?: string | null;
  source?: string;
}): Promise<boolean> {
  const sessionId = normalizeSid(input.sessionId);
  if (!sessionId) return false;
  if (!VISITOR_INTENT_SURFACES.includes(input.surface)) return false;
  if (!VISITOR_INTENT_STEPS.includes(input.step)) return false;

  const rate = await checkRateLimitOutcome(`visitor-intent:${sessionId}`, 30, 60_000);
  if (rate === "limited") return false;

  const now = new Date();
  const existing = await prisma.visitorIntentSession.findUnique({ where: { sessionId } });

  if (input.step === "session_end") {
    if (!existing) return true;
    await prisma.visitorIntentSession.update({
      where: { sessionId },
      data: { status: "left", leftAt: now, lastSeenAt: now },
    });
    return true;
  }

  const ip = pickClientIp(input.clientIp, existing?.clientIp);

  const prevStep = existing?.step as VisitorIntentStep | undefined;
  let resolvedStep: VisitorIntentStep = input.step;
  if (input.step === "heartbeat" && !existing) {
    if (!input.path?.trim() && !input.visitorLabel?.trim()) return false;
    resolvedStep = "browse";
  }
  if (existing && input.step === "heartbeat") {
    resolvedStep = prevStep ?? "browse";
  } else if (existing && prevStep) {
    resolvedStep = resolveStepTransition(prevStep, resolvedStep, {
      surface: input.surface,
      prevSurface: existing.surface as VisitorIntentSurface,
    });
  }

  const stepSince =
    existing && resolvedStep === prevStep ? existing.stepSince : now;

  const trail = appendStepTrail(
    existing?.stepTrail as VisitorIntentStepTrailEntry[] | undefined,
    input.step === "heartbeat" ? "heartbeat" : resolvedStep,
    now.getTime(),
  );

  await prisma.visitorIntentSession.upsert({
    where: { sessionId },
    create: {
      sessionId,
      surface: input.surface,
      step: resolvedStep,
      path: input.path?.trim().slice(0, 200) || null,
      planId: input.planId?.trim().slice(0, 20) || null,
      visitorLabel: input.visitorLabel?.trim().slice(0, 120) || null,
      clientIp: ip || null,
      ipCity: null,
      ipCountry: null,
      referrer: input.referrer?.trim().slice(0, 200) || null,
      source: (input.source ?? "web").trim().slice(0, 20) || "web",
      status: "online",
      stepSince,
      firstSeenAt: now,
      lastSeenAt: now,
      stepTrail: trail,
    },
    update: {
      surface: input.surface,
      step: resolvedStep,
      path: input.path?.trim().slice(0, 200) || existing?.path || null,
      planId: input.planId?.trim().slice(0, 20) || existing?.planId || null,
      visitorLabel: input.visitorLabel?.trim().slice(0, 120) || existing?.visitorLabel || null,
      clientIp: ip || existing?.clientIp || null,
      ipCity: existing?.ipCity ?? null,
      ipCountry: existing?.ipCountry ?? null,
      referrer: input.referrer?.trim().slice(0, 200) || existing?.referrer || null,
      status: "online",
      leftAt: null,
      stepSince,
      lastSeenAt: now,
      stepTrail: trail,
    },
  });

  return true;
}

export async function listLiveVisitorIntents(opts?: {
  surface?: VisitorIntentSurface | "";
  hotOnly?: boolean;
  activeWithinSeconds?: number;
  excludeTest?: boolean;
}): Promise<VisitorIntentRow[]> {
  const now = new Date();
  await pruneOldVisitorIntentSessions(now);
  const activeWithin = opts?.activeWithinSeconds ?? VISITOR_INTENT_ACTIVE_WITHIN_SECONDS;
  await markStaleVisitorSessionsLeft(now, activeWithin);
  const cutoff = new Date(now.getTime() - activeWithin * 1000);

  const rows = await prisma.visitorIntentSession.findMany({
    where: {
      lastSeenAt: { gte: cutoff },
      status: "online",
      ...(opts?.surface ? { surface: opts.surface } : {}),
    },
    orderBy: { lastSeenAt: "desc" },
    take: 200,
  });

  let mapped = rows.map(rowFromDb);
  if (opts?.hotOnly) {
    mapped = mapped.filter((row) => HOT_STEPS.has(row.step) || row.step === "browse");
  }
  if (opts?.excludeTest !== false) {
    mapped = mapped.filter((row) => !row.sessionId.startsWith("test-"));
  }
  mapped = mapped.filter((row) => !row.clientIp || !INFRA_IPS.has(row.clientIp));

  const enriched = await enrichRowsWithGeo(mapped);
  return enriched.map((row) => enrichLiveRow(row, now));
}

export async function listVisitorIntentLog(opts?: {
  surface?: VisitorIntentSurface | "";
  hours?: number;
  limit?: number;
  activeWithinSeconds?: number;
}): Promise<VisitorIntentRow[]> {
  const now = new Date();
  await pruneOldVisitorIntentSessions(now);
  const hours = Math.min(Math.max(opts?.hours ?? VISITOR_INTENT_LOG_HOURS, 1), 168);
  const limit = Math.min(Math.max(opts?.limit ?? 200, 1), 400);
  const minSeen = new Date(now.getTime() - hours * 3600 * 1000);
  const activeWithin = opts?.activeWithinSeconds ?? VISITOR_INTENT_ACTIVE_WITHIN_SECONDS;
  await markStaleVisitorSessionsLeft(now, activeWithin);
  const liveCutoff = new Date(now.getTime() - activeWithin * 1000);

  const liveRows = await prisma.visitorIntentSession.findMany({
    where: { lastSeenAt: { gte: liveCutoff }, status: "online" },
    select: { sessionId: true },
  });
  const liveSids = new Set(liveRows.map((r) => r.sessionId));

  const rows = await prisma.visitorIntentSession.findMany({
    where: {
      lastSeenAt: { gte: minSeen },
      ...(opts?.surface ? { surface: opts.surface } : {}),
    },
    orderBy: { firstSeenAt: "desc" },
    take: limit,
  });

  const mapped = rows
    .map(rowFromDb)
    .filter((row) => !row.sessionId.startsWith("test-"))
    .filter((row) => !row.clientIp || !INFRA_IPS.has(row.clientIp))
    .map((row) => enrichLogRow(row, now, liveSids));

  return enrichRowsWithGeo(mapped);
}

export function summarizeVisitorIntents(rows: VisitorIntentRow[]) {
  const bySurface: Record<string, number> = {
    marketing: 0,
    register: 0,
    checkout: 0,
  };
  const byStep: Record<string, number> = {};
  let stuckCount = 0;
  for (const row of rows) {
    bySurface[row.surface] = (bySurface[row.surface] ?? 0) + 1;
    byStep[row.step] = (byStep[row.step] ?? 0) + 1;
    if (row.stuck) stuckCount += 1;
  }
  return { total: rows.length, bySurface, byStep, stuckCount };
}

export function countPaymentsTodayFromLog(rows: VisitorIntentRow[]): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(new Date());
  const dayOf = (ms: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(new Date(ms));
  return rows.filter((row) => {
    if (row.step === "payment_success" && dayOf(row.lastSeenAt.getTime()) === today) return true;
    return row.stepTrail.some((t) => t.step === "payment_success" && dayOf(t.at) === today);
  }).length;
}

/** Μοναδικοί επισκέπτες που μπήκαν σήμερα (Europe/Athens). */
export async function countVisitorsToday(opts?: {
  surface?: VisitorIntentSurface | "";
  excludeTest?: boolean;
}): Promise<number> {
  const start = startOfTodayAthens();
  const rows = await prisma.visitorIntentSession.findMany({
    where: {
      firstSeenAt: { gte: start },
      ...(opts?.surface ? { surface: opts.surface } : {}),
    },
    select: { sessionId: true, clientIp: true },
  });

  return rows
    .filter((row) => (opts?.excludeTest !== false ? !row.sessionId.startsWith("test-") : true))
    .filter((row) => !row.clientIp || !INFRA_IPS.has(row.clientIp)).length;
}

export async function recordVisitorIntentPaymentSuccess(input: {
  visitorSid?: string | null;
  planId?: string | null;
  visitorLabel?: string | null;
}): Promise<boolean> {
  const sessionId = normalizeSid(input.visitorSid);
  if (!sessionId) return false;
  return recordVisitorIntent({
    sessionId,
    surface: "checkout",
    step: "payment_success",
    path: "/dashboard/billing",
    planId: input.planId,
    visitorLabel: input.visitorLabel,
    source: "stripe_webhook",
  });
}

export function serializeVisitorIntentRow(row: VisitorIntentRow) {
  const peak_step = peakFunnelStep(row);
  return {
    sid: row.sessionId,
    surface: row.surface,
    step: row.step,
    peak_step,
    path: row.path,
    plan_id: row.planId,
    visitor_label: row.visitorLabel,
    client_ip: row.clientIp,
    ip_city: row.ipCity,
    ip_country: row.ipCountry,
    referrer: row.referrer,
    source: row.source,
    status: row.status,
    step_since: Math.floor(row.stepSince.getTime() / 1000),
    first_seen: Math.floor(row.firstSeenAt.getTime() / 1000),
    last_seen: Math.floor(row.lastSeenAt.getTime() / 1000),
    left_at: row.leftAt ? Math.floor(row.leftAt.getTime() / 1000) : null,
    step_trail: row.stepTrail,
    step_seconds: row.stepSeconds ?? 0,
    stuck: Boolean(row.stuck),
    duration_seconds: row.durationSeconds ?? 0,
  };
}

export function clientIpFromRequest(request: Request, bodyIp?: string | null): string {
  return pickClientIp(
    bodyIp,
    request.headers.get("x-client-ip"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  );
}
