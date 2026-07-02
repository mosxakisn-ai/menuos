import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { diagnosticReportIngestSchema } from "@/lib/client-diagnostics-schemas";
import { recordClientDiagnostic } from "@/lib/client-diagnostics-service";
import { checkRateLimitOutcome } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const session = auth.session!;
  const limitKey = `diag:${session.organizationId}`;
  const limited = await checkRateLimitOutcome(limitKey, 80, 60 * 60 * 1000);
  if (limited === "limited") {
    return NextResponse.json({ ok: true, skipped: "rate_limited" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request" }, { status: 400 });
  }

  const parsed = diagnosticReportIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid_input" }, { status: 400 });
  }

  try {
    await recordClientDiagnostic({
      organizationId: session.organizationId,
      userId: session.userId,
      userEmail: session.email,
      severity: parsed.data.severity ?? "ERROR",
      source: parsed.data.source,
      category: parsed.data.category,
      message: parsed.data.message,
      errorCode: parsed.data.errorCode ?? null,
      stack: parsed.data.stack ?? null,
      context: {
        ...(parsed.data.context ?? {}),
        role: session.role,
      },
    });
  } catch (err) {
    console.error("[menuos-diagnostics] ingest", err);
  }

  return NextResponse.json({ ok: true });
}
