import { NextResponse } from "next/server";
import { getSupervisorSession } from "@/lib/supervisor-auth";

export async function GET() {
  const session = await getSupervisorSession();
  return NextResponse.json({ authenticated: Boolean(session), username: session?.username ?? null });
}
