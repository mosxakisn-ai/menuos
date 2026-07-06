import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import {
  VISITOR_INTENT_ACTIVE_WITHIN_SECONDS,
  VISITOR_INTENT_STUCK_STEP_SECONDS,
  VISITOR_INTENT_SURFACES,
  countPaymentsTodayFromLog,
  listLiveVisitorIntents,
  listVisitorIntentLog,
  serializeVisitorIntentRow,
  summarizeVisitorIntents,
} from "@/lib/visitor-intent-service";

export async function GET(request: Request) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const surfaceRaw = url.searchParams.get("surface")?.trim() ?? "";
  const surface = VISITOR_INTENT_SURFACES.includes(surfaceRaw as (typeof VISITOR_INTENT_SURFACES)[number])
    ? (surfaceRaw as (typeof VISITOR_INTENT_SURFACES)[number])
    : "";
  const hotOnly = url.searchParams.get("hot") !== "0";
  const activeWithinRaw = url.searchParams.get("active_within");
  let activeWithin = VISITOR_INTENT_ACTIVE_WITHIN_SECONDS;
  if (activeWithinRaw) {
    const n = Number(activeWithinRaw);
    if (Number.isFinite(n)) activeWithin = Math.min(Math.max(n, 5), 300);
  }

  const rows = await listLiveVisitorIntents({
    surface,
    hotOnly,
    activeWithinSeconds: activeWithin,
    excludeTest: url.searchParams.get("exclude_test") !== "0",
  });

  const logRows = await listVisitorIntentLog({ hours: 24, limit: 300, activeWithinSeconds: activeWithin });
  const paymentsToday = countPaymentsTodayFromLog(logRows);

  return NextResponse.json({
    sessions: rows.map(serializeVisitorIntentRow),
    summary: summarizeVisitorIntents(rows),
    payments_today: paymentsToday,
    active_within_seconds: activeWithin,
    stuck_threshold_seconds: VISITOR_INTENT_STUCK_STEP_SECONDS,
    fetched_at: new Date().toISOString(),
  });
}
