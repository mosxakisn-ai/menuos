import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import {
  deleteHelpDeskReportsForOrganization,
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

/** Bulk delete logs for one customer (supervisor only). */
export async function DELETE(request: Request) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const organizationIdRaw = url.searchParams.get("organizationId");
  const statusRaw = url.searchParams.get("status") ?? "RESOLVED";

  if (organizationIdRaw === null || organizationIdRaw === "") {
    return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  }

  const statusFilter =
    statusRaw === "ALL" ||
    statusRaw === "OPEN" ||
    statusRaw === "ACKNOWLEDGED" ||
    statusRaw === "RESOLVED"
      ? statusRaw
      : "RESOLVED";

  try {
    const deleted = await deleteHelpDeskReportsForOrganization({
      organizationId: organizationIdRaw === "unknown" ? null : organizationIdRaw,
      status: statusFilter as "ALL" | "OPEN" | "ACKNOWLEDGED" | "RESOLVED",
    });
    const summary = await getHelpDeskSummary();
    return NextResponse.json({ ok: true, deleted, summary });
  } catch (err) {
    console.error("[menuos-supervisor] help-desk bulk delete", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
