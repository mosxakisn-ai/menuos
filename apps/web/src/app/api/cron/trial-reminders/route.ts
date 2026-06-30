import { NextResponse } from "next/server";
import { processTrialReminderEmails } from "@/lib/trial-reminders";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const header = request.headers.get("x-cron-secret");
  return header === secret;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processTrialReminderEmails();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[menuos-cron] trial-reminders failed", err);
    return NextResponse.json({ error: "Trial reminder job failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
