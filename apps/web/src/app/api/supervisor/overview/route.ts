import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { getSupervisorOverview } from "@/lib/supervisor-service";

export async function GET() {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const overview = await getSupervisorOverview();
  return NextResponse.json(overview);
}
