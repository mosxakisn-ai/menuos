import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SUPERVISOR_COOKIE } from "@/lib/supervisor-auth";

export async function POST() {
  (await cookies()).set(SUPERVISOR_COOKIE, "", { ...{ path: "/", maxAge: 0 } });
  return NextResponse.json({ ok: true });
}
