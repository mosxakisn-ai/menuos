import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUPERVISOR_COOKIE, supervisorCookieOptions } from "@/lib/supervisor-auth";

export async function POST() {
  (await cookies()).set(SUPERVISOR_COOKIE, "", { ...supervisorCookieOptions(), maxAge: 0 });
  return NextResponse.json({ ok: true });
}
