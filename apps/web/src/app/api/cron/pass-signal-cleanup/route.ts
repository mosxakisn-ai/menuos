import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { processPassSignalCleanup } from "@/lib/pass-signal-cleanup";

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processPassSignalCleanup();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[menuos-cron] pass-signal-cleanup failed", err);
    return NextResponse.json({ error: "Pass signal cleanup job failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
