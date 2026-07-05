import { NextResponse } from "next/server";
import { requireLive360Plan } from "@/lib/api-auth";
import { countOrganizationMonitorActive } from "@/lib/monitor-active-count";

export async function GET() {
  const auth = await requireLive360Plan();
  if (auth.response) return auth.response;

  const counts = await countOrganizationMonitorActive(auth.session!.organizationId);

  return NextResponse.json(counts);
}
