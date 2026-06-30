import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { processDemoVenueCleanup } from "@/lib/demo-cleanup";

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDemoVenueCleanup();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[menuos-cron] demo-cleanup failed", err);
    return NextResponse.json({ error: "Demo cleanup job failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
