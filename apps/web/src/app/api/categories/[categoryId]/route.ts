import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getCategoryForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ categoryId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { categoryId } = await params;
  const category = await getCategoryForOrganization(categoryId, auth.session!.organizationId);
  if (!category) {
    return NextResponse.json({ error: "Η κατηγορία δεν βρέθηκε." }, { status: 404 });
  }

  await prisma.category.delete({ where: { id: categoryId } });
  return NextResponse.json({ ok: true, message: "Η κατηγορία διαγράφηκε." });
}
