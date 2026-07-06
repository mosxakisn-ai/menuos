import { prisma } from "@menuos/db";
import { checkRateLimitOutcome } from "@/lib/rate-limit";

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
  "payment_failed",
  "stripe_init_failed",
]);

const STUCK_STEPS = new Set<VisitorIntentStep>([
  "checkout_opened",
  "pay_clicked",
  "stripe_redirect",
  "register_otp",
]);

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
  return trail.slice(-12);
}

function enrichLiveRow(row: VisitorIntentRow, now: Date): VisitorIntentRow {
  const stepSeconds = Math.max(0, Math.floor((now.getTime() - row.stepSince.getTime()) / 1000));
  const stuck = STUCK_STEPS.has(row.step) && stepSeconds >= VISITOR_INTENT_STUCK_STEP_SECONDS;
  return { ...row, stepSeconds, stuck };
}

function enrichLogRow(row: VisitorIntentRow, now: Date, liveSids: Set<string>): VisitorIntentRow {
  const first = row.firstSeenAt.getTime();
  const last = row.lastSeenAt.getTime();
  const end = row.leftAt?.getTime() ?? last;
  let durationSeconds = Math.max(0, Math.floor((end - first) / 1000));
  durationSeconds = Math.min(durationSeconds, 6 * 3600);
  const online = liveSids.has(row.sessionId);
  return {
    ...row,
    status: online ? "online" : row.status === "left" ? "left" : "left",
    leftAt: online ? null : row.leftAt ?? row.lastSeenAt,
    durationSeconds,
    stepSeconds: Math.max(0, Math.floor((now.getTime() - row.stepSince.getTime()) / 1000)),
    stuck: STUCK_STEPS.has(row.step) && Math.max(0, Math.floor((now.getTime() - row.stepSince.getTime()) / 1000)) >= VISITOR_INTENT_STUCK_STEP_SECONDS,
  };
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

  let resolvedStep: VisitorIntentStep = input.step;
  if (input.step === "heartbeat" && !existing) {
    if (!input.path?.trim() && !input.visitorLabel?.trim()) return false;
    resolvedStep = "browse";
  }

  const ip = pickClientIp(input.clientIp, existing?.clientIp);
  let ipCity = existing?.ipCity ?? null;
  let ipCountry = existing?.ipCountry ?? null;
  if (ip && (!ipCity || !ipCountry)) {
    const geo = await lookupIpGeo(ip);
    ipCity = geo.city || ipCity;
    ipCountry = geo.country || ipCountry;
  }

  const prevStep = existing?.step as VisitorIntentStep | undefined;
  if (existing && input.step === "heartbeat") {
    resolvedStep = prevStep ?? "browse";
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
      ipCity,
      ipCountry,
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
      ipCity,
      ipCountry,
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

  return mapped.map((row) => enrichLiveRow(row, now));
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
    orderBy: { lastSeenAt: "desc" },
    take: limit,
  });

  return rows
    .map(rowFromDb)
    .filter((row) => !row.sessionId.startsWith("test-"))
    .filter((row) => !row.clientIp || !INFRA_IPS.has(row.clientIp))
    .map((row) => enrichLogRow(row, now, liveSids));
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
  return rows.filter((row) => {
    if (row.step !== "payment_success") return false;
    const ts = row.lastSeenAt.getTime();
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(new Date(ts));
    if (day === today) return true;
    return row.stepTrail.some(
      (t) => t.step === "payment_success" && new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Athens" }).format(new Date(t.at)) === today,
    );
  }).length;
}

export function serializeVisitorIntentRow(row: VisitorIntentRow) {
  return {
    sid: row.sessionId,
    surface: row.surface,
    step: row.step,
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
