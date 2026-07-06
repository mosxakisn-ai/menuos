import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@menuos/shared";
import { requireSupervisor } from "@/lib/api-auth";
import { updatePlanCatalog } from "@/lib/plan-catalog-service";
import { supervisorPlanUpdateSchema } from "@/lib/supervisor-schemas";

type RouteParams = { params: Promise<{ planId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireSupervisor();
  if (auth.response) return auth.response;

  const { planId } = await params;
  if (!(SUBSCRIPTION_PLANS as readonly string[]).includes(planId)) {
    return NextResponse.json({ error: "Άγνωστο πακέτο." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = supervisorPlanUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Έλεγξε τα πεδία του πακέτου." }, { status: 400 });
  }

  try {
    const plan = await updatePlanCatalog(planId as (typeof SUBSCRIPTION_PLANS)[number], parsed.data);
    return NextResponse.json({ plan, message: "Το πακέτο ενημερώθηκε." });
  } catch (err) {
    console.error("[menuos-supervisor] update plan", err);
    const message = err instanceof Error && err.message.includes("No allowed fields")
      ? "Δεν επιτρέπεται επεξεργασία αυτών των πεδίων για το πακέτο."
      : "Αποτυχία ενημέρωσης.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
