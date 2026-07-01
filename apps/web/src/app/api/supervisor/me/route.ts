import { NextResponse } from "next/server";
import { getSupervisorSession } from "@/lib/supervisor-auth";
import { findSupervisorOperatorByUsername } from "@/lib/supervisor-operator-service";

export async function GET() {
  const session = await getSupervisorSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, username: null, name: null });
  }

  const operator = await findSupervisorOperatorByUsername(session.username);
  return NextResponse.json({
    authenticated: true,
    username: session.username,
    name: operator?.name?.trim() || session.username,
  });
}
