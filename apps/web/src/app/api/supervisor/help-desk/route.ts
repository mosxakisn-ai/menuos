import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import {
  getHelpDeskSummary,
  listHelpDeskCustomers,
  listHelpDeskReports,
} from "@/lib/client-diagnostics-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") ?? "ACTIVE";
  const organizationId = url.searchParams.get("organizationId");

  const statusFilter =
    status === "ALL" ||
    status === "OPEN" ||
    status === "ACKNOWLEDGED" ||
    status === "RESOLVED" ||
    status === "ACTIVE"
      ? status
      : "ACTIVE";

  try {
    const summary = await getHelpDeskSummary();

    if (organizationId !== null && organizationId !== undefined && organizationId !== "") {
      const reports = await listHelpDeskReports({
        organizationId: organizationId === "unknown" ? null : organizationId,
        status: statusFilter as "ALL" | "OPEN" | "ACKNOWLEDGED" | "RESOLVED",
      });
      return NextResponse.json({ summary, reports });
    }

    const customers = await listHelpDeskCustomers({
      search,
      status: statusFilter as "ALL" | "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "ACTIVE",
    });

    return NextResponse.json({ summary, customers });
  } catch (err) {
    console.error("[menuos-supervisor] help-desk", err);
    return NextResponse.json({ error: "Failed to load help desk" }, { status: 500 });
  }
}
