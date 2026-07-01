import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { passSignalStatusUpdateSchema } from "@menuos/shared";
import { requireWaiterVenueAccess } from "@/lib/staff-auth";

type Props = { params: Promise<{ signalId: string }> };

export async function PATCH(request: Request, { params }: Props) {
  const { signalId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = passSignalStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρη κατάσταση." }, { status: 400 });
  }

  const existing = await prisma.passSignal.findUnique({
    where: { id: signalId },
    select: { id: true, venueId: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Η ειδοποίηση δεν βρέθηκε." }, { status: 404 });
  }

  const fakeRequest = parsed.data.staffKey
    ? new Request(request.url, {
        headers: {
          ...Object.fromEntries(request.headers.entries()),
          "x-menuos-staff-key": parsed.data.staffKey,
        },
      })
    : request;

  const auth = await requireWaiterVenueAccess(fakeRequest, existing.venueId);
  if (auth.response) return auth.response;

  const next = parsed.data.status;
  const allowed: Record<string, string[]> = {
    READY: ["PICKED_UP", "DELIVERED"],
    PICKED_UP: ["DELIVERED"],
    DELIVERED: [],
  };
  if (!allowed[existing.status]?.includes(next)) {
    return NextResponse.json({ error: "Η κατάσταση δεν επιτρέπεται." }, { status: 409 });
  }

  const now = new Date();
  const signal = await prisma.passSignal.update({
    where: { id: signalId },
    data: {
      status: next,
      ...(next === "PICKED_UP" ? { pickedUpAt: now } : {}),
      ...(next === "DELIVERED"
        ? {
            deliveredAt: now,
            ...(existing.status === "READY" ? { pickedUpAt: now } : {}),
          }
        : {}),
    },
  });

  return NextResponse.json({ signal });
}
