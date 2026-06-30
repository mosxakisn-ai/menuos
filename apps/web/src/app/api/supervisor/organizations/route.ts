import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { listOrganizationsForSupervisor } from "@/lib/supervisor-service";

export async function GET(request: Request) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const organizations = await listOrganizationsForSupervisor({
    search: searchParams.get("search") ?? undefined,
    plan: searchParams.get("plan") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  return NextResponse.json({ organizations });
}
