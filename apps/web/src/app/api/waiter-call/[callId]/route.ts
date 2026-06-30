import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { waiterCallUpdateSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";

type Params = { params: Promise<{ callId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription();
  if (auth.response) return auth.response;

  const { callId } = await params;

  const existing = await prisma.waiterCall.findFirst({
    where: {
      id: callId,
      venue: { organizationId: auth.session!.organizationId },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Η κλήση δεν βρέθηκε." }, { status: 404 });
  }

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

  const call = await prisma.waiterCall.update({
    where: { id: callId },
    data: { status: parsed.data.status },
  });

  const messages: Record<string, string> = {
    ACKNOWLEDGED: "Η κλήση σημειώθηκε — πήγαινε στο τραπέζι.",
    COMPLETED: "Η κλήση ολοκληρώθηκε.",
    PENDING: "Η κλήση επανήλθε σε αναμονή.",
  };

  return NextResponse.json({ call, message: messages[parsed.data.status] });
}
