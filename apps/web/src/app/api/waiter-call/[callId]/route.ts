import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { formatWaiterCallLocation, listVenuePosts, waiterCallUpdateSchema, waiterCallsVisibleToStaffMember } from "@menuos/shared";
import { logWaiterCallStatusChange } from "@/lib/push-diagnostics";
import { requireWaiterCallAccess } from "@/lib/staff-auth";
import { getVenueOperationsConfig } from "@/lib/venue-operations-config-service";

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

  const member = auth.access!.staffMember;
  if (member) {
    const opsConfig = await getVenueOperationsConfig(auth.access!.venue.id);
    const posts = listVenuePosts(opsConfig);
    if (!waiterCallsVisibleToStaffMember(member.stations, posts)) {
      return NextResponse.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
    }
  }

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

  const updated = await prisma.waiterCall.updateMany({
    where: { id: callId, status: existing.status },
    data: { status: next },
  });
  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Η κατάσταση άλλαξε από άλλον χρήστη.", code: "conflict" },
      { status: 409 },
    );
  }

  const call = await prisma.waiterCall.findUniqueOrThrow({ where: { id: callId } });

  if (parsed.data.status === "ACKNOWLEDGED" || parsed.data.status === "COMPLETED") {
    logWaiterCallStatusChange({
      organizationId: auth.access!.venue.organizationId,
      venueId: existing.venueId,
      callId: existing.id,
      callType: existing.type,
      location: formatWaiterCallLocation(existing),
      status: parsed.data.status,
      staffMemberName: member?.name ?? null,
      createdAt: existing.createdAt,
    });
  }

  const messages: Record<string, string> = {
    ACKNOWLEDGED: "Η κλήση σημειώθηκε — πήγαινε στο τραπέζι.",
    COMPLETED: "Η κλήση ολοκληρώθηκε.",
  };

  return NextResponse.json({ call, message: messages[parsed.data.status] });
}
