import { NextResponse } from "next/server";
import { prisma, WaiterCallStatus } from "@menuos/db";
import { waiterCallSchema } from "@menuos/shared";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = waiterCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const venue = await prisma.venue.findFirst({
    where: { slug: parsed.data.venueSlug },
  });
  if (!venue) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  const call = await prisma.waiterCall.create({
    data: {
      venueId: venue.id,
      tableNumber: parsed.data.tableNumber,
      roomNumber: parsed.data.roomNumber,
      status: WaiterCallStatus.PENDING,
    },
  });

  return NextResponse.json({ id: call.id });
}
