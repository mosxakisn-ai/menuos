import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import {
  VISITOR_INTENT_ACTIVE_WITHIN_SECONDS,
  VISITOR_INTENT_LOG_HOURS,
  VISITOR_INTENT_SURFACES,
  listVisitorIntentLog,
  serializeVisitorIntentRow,
} from "@/lib/visitor-intent-service";

export async function GET(request: Request) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const surfaceRaw = url.searchParams.get("surface")?.trim() ?? "";
  const surface = VISITOR_INTENT_SURFACES.includes(surfaceRaw as (typeof VISITOR_INTENT_SURFACES)[number])
    ? (surfaceRaw as (typeof VISITOR_INTENT_SURFACES)[number])
    : "";
  const hoursRaw = url.searchParams.get("hours");
  const limitRaw = url.searchParams.get("limit");
  const hours = hoursRaw ? Number(hoursRaw) : VISITOR_INTENT_LOG_HOURS;
  const limit = limitRaw ? Number(limitRaw) : 200;
  const activeWithinRaw = url.searchParams.get("active_within");
  let activeWithin = VISITOR_INTENT_ACTIVE_WITHIN_SECONDS;
  if (activeWithinRaw) {
    const n = Number(activeWithinRaw);
    if (Number.isFinite(n)) activeWithin = Math.min(Math.max(n, 5), 300);
  }

  const rows = await listVisitorIntentLog({
    surface,
    hours: Number.isFinite(hours) ? hours : VISITOR_INTENT_LOG_HOURS,
    limit: Number.isFinite(limit) ? limit : 200,
    activeWithinSeconds: activeWithin,
  });

  return NextResponse.json({
    entries: rows.map(serializeVisitorIntentRow),
    total: rows.length,
    hours: Number.isFinite(hours) ? hours : VISITOR_INTENT_LOG_HOURS,
    fetched_at: new Date().toISOString(),
  });
}
