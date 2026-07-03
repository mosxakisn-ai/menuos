import { createHash } from "node:crypto";
import { prisma, type DiagnosticSeverity, type DiagnosticStatus, type Prisma } from "@menuos/db";

const MAX_STACK = 8000;
const MAX_MESSAGE = 2000;

export type DiagnosticIngestInput = {
  organizationId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  severity?: DiagnosticSeverity;
  /** Closed audit entries (e.g. push delivery OK) skip open ticket queue. */
  initialStatus?: DiagnosticStatus;
  source: string;
  category: string;
  message: string;
  errorCode?: string | null;
  stack?: string | null;
  context?: Prisma.InputJsonValue | null;
  /** Unique per event (signalId, callId) — avoids merging distinct staff/push events. */
  dedupeKey?: string | null;
};

export type HelpDeskCustomerRow = {
  organizationId: string | null;
  organizationName: string;
  adminEmail: string | null;
  plan: string | null;
  subscriptionStatus: string | null;
  openCount: number;
  totalCount: number;
  latestAt: string;
  latestMessage: string;
  latestCategory: string;
  latestSeverity: DiagnosticSeverity;
};

export type HelpDeskReportRow = {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  userEmail: string | null;
  severity: DiagnosticSeverity;
  status: DiagnosticStatus;
  source: string;
  category: string;
  message: string;
  errorCode: string | null;
  stack: string | null;
  context: unknown;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  internalNote: string | null;
};

function trimText(value: string | null | undefined, max: number): string {
  const t = value?.trim() ?? "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function buildDiagnosticFingerprint(input: DiagnosticIngestInput): string {
  const uniquePart =
    input.dedupeKey?.trim().toLowerCase() ?? input.message.trim().slice(0, 240).toLowerCase();
  const raw = [
    input.organizationId ?? "",
    input.category.trim().toLowerCase(),
    input.errorCode?.trim().toLowerCase() ?? "",
    uniquePart,
  ].join("|");
  return createHash("sha256").update(raw).digest("hex").slice(0, 40);
}

export { inferDiagnosticCategoryFromPath } from "@/lib/diagnostic-category";

export async function recordClientDiagnostic(input: DiagnosticIngestInput): Promise<void> {
  const message = trimText(input.message, MAX_MESSAGE);
  if (!message) return;

  const fingerprint = buildDiagnosticFingerprint({ ...input, message });
  const stack = input.stack ? trimText(input.stack, MAX_STACK) : null;
  const now = new Date();

  const existing = await prisma.clientDiagnosticReport.findFirst({
    where: {
      fingerprint,
      status: { in: ["OPEN", "ACKNOWLEDGED"] },
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    },
    orderBy: { lastSeenAt: "desc" },
  });

  if (existing) {
    await prisma.clientDiagnosticReport.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: now,
        occurrenceCount: { increment: 1 },
        severity: input.severity ?? existing.severity,
        context: (input.context ?? existing.context ?? undefined) as Prisma.InputJsonValue | undefined,
        stack: stack ?? existing.stack,
        userEmail: input.userEmail ?? existing.userEmail,
      },
    });
    return;
  }

  const initialStatus = input.initialStatus ?? "OPEN";
  await prisma.clientDiagnosticReport.create({
    data: {
      organizationId: input.organizationId ?? null,
      userId: input.userId ?? null,
      userEmail: input.userEmail ?? null,
      severity: input.severity ?? "ERROR",
      status: initialStatus,
      source: input.source.slice(0, 64),
      category: input.category.slice(0, 64),
      message,
      errorCode: input.errorCode?.slice(0, 128) ?? null,
      stack,
      context: (input.context ?? undefined) as Prisma.InputJsonValue | undefined,
      fingerprint,
      ...(initialStatus === "RESOLVED" ? { resolvedAt: now } : {}),
    },
  });
}

/** Fire-and-forget server-side diagnostic — never throws to caller. */
export function logServerDiagnostic(input: DiagnosticIngestInput): void {
  void recordClientDiagnostic(input).catch((err) => {
    console.error("[menuos-diagnostics] record failed", err);
  });
}

export async function getHelpDeskSummary() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [openCount, last24h, affectedOrgs] = await Promise.all([
    prisma.clientDiagnosticReport.count({ where: { status: "OPEN" } }),
    prisma.clientDiagnosticReport.count({ where: { lastSeenAt: { gte: since24h } } }),
    prisma.clientDiagnosticReport.groupBy({
      by: ["organizationId"],
      where: { status: { in: ["OPEN", "ACKNOWLEDGED"] }, organizationId: { not: null } },
    }),
  ]);

  return {
    openCount,
    last24h,
    affectedCustomers: affectedOrgs.length,
  };
}

export async function listHelpDeskCustomers(params: {
  search?: string;
  status?: DiagnosticStatus | "ALL" | "ACTIVE";
  limit?: number;
}): Promise<HelpDeskCustomerRow[]> {
  const statusFilter =
    params.status === "ACTIVE"
      ? { in: ["OPEN", "ACKNOWLEDGED"] as DiagnosticStatus[] }
      : params.status && params.status !== "ALL"
        ? params.status
        : undefined;

  const reports = await prisma.clientDiagnosticReport.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { lastSeenAt: "desc" },
    take: 500,
    include: {
      organization: {
        include: {
          subscription: true,
          users: { where: { role: "ADMIN" }, take: 1, orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  const grouped = new Map<string, HelpDeskCustomerRow>();

  for (const row of reports) {
    const orgId = row.organizationId ?? "__unknown__";
    const orgName = row.organization?.name ?? "Άγνωστος πελάτης";
    const adminEmail = row.organization?.users[0]?.email ?? row.userEmail ?? null;
    const existing = grouped.get(orgId);

    if (!existing) {
      grouped.set(orgId, {
        organizationId: row.organizationId,
        organizationName: orgName,
        adminEmail,
        plan: row.organization?.subscription?.plan ?? null,
        subscriptionStatus: row.organization?.subscription?.status ?? null,
        openCount: row.status === "OPEN" ? 1 : 0,
        totalCount: 1,
        latestAt: row.lastSeenAt.toISOString(),
        latestMessage: row.message,
        latestCategory: row.category,
        latestSeverity: row.severity,
      });
      continue;
    }

    existing.totalCount += 1;
    if (row.status === "OPEN") existing.openCount += 1;
    if (row.lastSeenAt.toISOString() > existing.latestAt) {
      existing.latestAt = row.lastSeenAt.toISOString();
      existing.latestMessage = row.message;
      existing.latestCategory = row.category;
      existing.latestSeverity = row.severity;
    }
  }

  let rows = [...grouped.values()].sort(
    (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
  );

  const q = params.search?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.organizationName.toLowerCase().includes(q) ||
        r.adminEmail?.toLowerCase().includes(q) ||
        r.latestMessage.toLowerCase().includes(q),
    );
  }

  return rows.slice(0, params.limit ?? 100);
}

export async function listHelpDeskReports(params: {
  organizationId?: string | null;
  status?: DiagnosticStatus | "ALL";
  limit?: number;
}): Promise<HelpDeskReportRow[]> {
  const where: {
    organizationId?: string | null;
    status?: DiagnosticStatus | { in: DiagnosticStatus[] };
  } = {};

  if (params.organizationId !== undefined) {
    where.organizationId = params.organizationId;
  }
  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }

  const rows = await prisma.clientDiagnosticReport.findMany({
    where,
    orderBy: { lastSeenAt: "desc" },
    take: params.limit ?? 200,
    include: { organization: { select: { name: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    organizationName: row.organization?.name ?? null,
    userEmail: row.userEmail,
    severity: row.severity,
    status: row.status,
    source: row.source,
    category: row.category,
    message: row.message,
    errorCode: row.errorCode,
    stack: row.stack,
    context: row.context,
    occurrenceCount: row.occurrenceCount,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolvedBy: row.resolvedBy,
    internalNote: row.internalNote,
  }));
}

export async function updateHelpDeskReport(
  id: string,
  patch: {
    status?: DiagnosticStatus;
    internalNote?: string | null;
    resolvedBy?: string | null;
  },
): Promise<HelpDeskReportRow | null> {
  const existing = await prisma.clientDiagnosticReport.findUnique({ where: { id } });
  if (!existing) return null;

  const now = new Date();
  const data: {
    status?: DiagnosticStatus;
    internalNote?: string | null;
    resolvedAt?: Date | null;
    resolvedBy?: string | null;
  } = {};

  if (patch.internalNote !== undefined) data.internalNote = patch.internalNote;
  if (patch.status) {
    data.status = patch.status;
    if (patch.status === "RESOLVED") {
      data.resolvedAt = now;
      data.resolvedBy = patch.resolvedBy ?? null;
    } else {
      data.resolvedAt = null;
      data.resolvedBy = null;
    }
  }

  const row = await prisma.clientDiagnosticReport.update({
    where: { id },
    data,
    include: { organization: { select: { name: true } } },
  });

  return {
    id: row.id,
    organizationId: row.organizationId,
    organizationName: row.organization?.name ?? null,
    userEmail: row.userEmail,
    severity: row.severity,
    status: row.status,
    source: row.source,
    category: row.category,
    message: row.message,
    errorCode: row.errorCode,
    stack: row.stack,
    context: row.context,
    occurrenceCount: row.occurrenceCount,
    firstSeenAt: row.firstSeenAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolvedBy: row.resolvedBy,
    internalNote: row.internalNote,
  };
}
