import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { waiterCallUpdateSchema } from "@menuos/shared";
import { requireWaiterCallAccess } from "@/lib/staff-auth";

type Params = { params: Promise<{ callId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { callId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = waiterCallUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρη κατάσταση." }, { status: 400 });
  }

  const auth = await requireWaiterCallAccess(request, callId, parsed.data.staffKey);
  if (auth.response) return auth.response;

  const existing = await prisma.waiterCall.findFirst({
    where: {
      id: callId,
      venue: { organizationId: auth.access!.venue.organizationId },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Η κλήση δεν βρέθηκε." }, { status: 404 });
  }

  const allowed: Record<string, string[]> = {
    PENDING: ["ACKNOWLEDGED", "COMPLETED"],
    ACKNOWLEDGED: ["COMPLETED"],
    COMPLETED: [],
    CANCELED: [],
  };
  const next = parsed.data.status;
  if (!allowed[existing.status]?.includes(next)) {
    return NextResponse.json(
      { error: "Μη έγκυρη αλλαγή κατάστασης.", code: "invalid_transition" },
      { status: 409 },
    );
  }

  const call = await prisma.waiterCall.update({
    where: { id: callId },
    data: { status: parsed.data.status },
  });

  const messages: Record<string, string> = {
    ACKNOWLEDGED: "Η κλήση σημειώθηκε — πήγαινε στο τραπέζι.",
    COMPLETED: "Η κλήση ολοκληρώθηκε.",
  };

  return NextResponse.json({ call, message: messages[parsed.data.status] });
}
