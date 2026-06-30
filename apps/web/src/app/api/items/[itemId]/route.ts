import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { itemPatchSchema } from "@menuos/shared";
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = itemPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα δεδομένα πιάτου." }, { status: 400 });
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...(parsed.data.available !== undefined ? { available: parsed.data.available } : {}),
      ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
    },
    include: { translations: true },
  });

  return NextResponse.json({
    item,
    message: parsed.data.available === false ? "Το πιάτο απενεργοποιήθηκε." : "Το πιάτο ενημερώθηκε.",
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
