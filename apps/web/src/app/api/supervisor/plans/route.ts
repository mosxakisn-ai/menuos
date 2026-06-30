import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { listPlanCatalogEntries } from "@/lib/plan-catalog-service";

export async function GET() {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  try {
    const plans = await listPlanCatalogEntries();
    return NextResponse.json({ plans });
  } catch (err) {
    console.error("[menuos-supervisor] list plans", err);
    return NextResponse.json({ error: "Αποτυχία φόρτωσης." }, { status: 500 });
  }
}
