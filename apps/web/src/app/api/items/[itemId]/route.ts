import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getItemForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { itemId } = await params;
  const existing = await getItemForOrganization(itemId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let body: { available?: boolean; price?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...(typeof body.available === "boolean" ? { available: body.available } : {}),
      ...(typeof body.price === "number" ? { price: body.price } : {}),
    },
    include: { translations: true },
  });

  return NextResponse.json({
    item,
    message: body.available === false ? "Το πιάτο απενεργοποιήθηκε." : "Το πιάτο ενημερώθηκε.",
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { itemId } = await params;
  const existing = await getItemForOrganization(itemId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.item.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true, message: "Το πιάτο διαγράφηκε." });
}
