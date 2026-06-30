import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SUPERVISOR_COOKIE,
  createSupervisorToken,
  supervisorCookieOptions,
  verifySupervisorCredentials,
} from "@/lib/supervisor-auth";
import { checkRateLimitOutcome, clientIp, RATE_LIMIT_SERVER_ERROR } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipLimit = await checkRateLimitOutcome(`supervisor-login:ip:${ip}`, 20, 15 * 60 * 1000);
  if (ipLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (ipLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Συμπλήρωσε username και password." }, { status: 400 });
  }

  const userLimit = await checkRateLimitOutcome(
    `supervisor-login:user:${username.toLowerCase()}`,
    10,
    15 * 60 * 1000,
  );
  if (userLimit === "unavailable") {
    return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
  }
  if (userLimit === "limited") {
    return NextResponse.json(
      { error: "Πολλές προσπάθειες. Δοκίμασε αργότερα.", code: "rate_limited" },
      { status: 429 },
    );
  }

  if (!(await verifySupervisorCredentials(username, password))) {
    return NextResponse.json({ error: "Λάθος στοιχεία σύνδεσης." }, { status: 401 });
  }

  const token = createSupervisorToken(username);
  (await cookies()).set(SUPERVISOR_COOKIE, token, supervisorCookieOptions());
  return NextResponse.json({ ok: true });
}
