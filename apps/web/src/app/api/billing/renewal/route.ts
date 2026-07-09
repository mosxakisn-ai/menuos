import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { setOrganizationSubscriptionRenewal } from "@/lib/billing";

export async function POST(request: Request) {
  const auth = await requireSession({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: { cancelAtPeriodEnd?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  if (typeof body.cancelAtPeriodEnd !== "boolean") {
    return NextResponse.json(
      { error: "Απαιτείται cancelAtPeriodEnd (true/false)." },
      { status: 400 },
    );
  }

  const result = await setOrganizationSubscriptionRenewal({
    organizationId: auth.session!.organizationId,
    cancelAtPeriodEnd: body.cancelAtPeriodEnd,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    currentPeriodEnd: result.currentPeriodEnd?.toISOString() ?? null,
  });
}
