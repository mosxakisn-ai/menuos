import { NextResponse } from "next/server";
import { requireSupervisor } from "@/lib/api-auth";
import { helpDeskReportUpdateSchema } from "@/lib/client-diagnostics-schemas";
import { updateHelpDeskReport } from "@/lib/client-diagnostics-service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "bad_request" }, { status: 400 });
  }

  const parsed = helpDeskReportUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ code: "invalid_input" }, { status: 400 });
  }

  try {
    const row = await updateHelpDeskReport(id, {
      ...parsed.data,
      resolvedBy:
        parsed.data.status === "RESOLVED" ? auth.supervisor!.username : undefined,
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ report: row });
  } catch (err) {
    console.error("[menuos-supervisor] help-desk update", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
