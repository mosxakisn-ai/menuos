import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SUPERVISOR_COOKIE,
  createSupervisorToken,
  supervisorCookieOptions,
  verifySupervisorCredentials,
} from "@/lib/supervisor-auth";

export async function POST(request: Request) {
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

  if (!verifySupervisorCredentials(username, password)) {
    return NextResponse.json({ error: "Λάθος στοιχεία σύνδεσης." }, { status: 401 });
  }

  const token = createSupervisorToken();
  (await cookies()).set(SUPERVISOR_COOKIE, token, supervisorCookieOptions());
  return NextResponse.json({ ok: true });
}
