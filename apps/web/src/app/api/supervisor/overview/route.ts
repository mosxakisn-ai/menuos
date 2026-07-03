import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { getSupervisorOverview } from "@/lib/supervisor-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  try {
    const overview = await getSupervisorOverview();
    return NextResponse.json(overview);
  } catch (err) {
    console.error("[menuos-supervisor] overview", err);
    return NextResponse.json({ error: "Αποτυχία φόρτωσης στατιστικών." }, { status: 500 });
  }
}
