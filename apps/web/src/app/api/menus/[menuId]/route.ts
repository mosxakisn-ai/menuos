import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { requireActiveSubscription } from "@/lib/api-auth";
import { serializableTransaction } from "@/lib/plan-limits";
import { getMenuForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ menuId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { menuId } = await params;
  const menu = await getMenuForOrganization(menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: "Ο κατάλογος δεν βρέθηκε." }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const menuCount = await tx.menu.count({ where: { venueId: menu.venueId } });
      if (menuCount <= 1) throw new Error("menu_last");

      const categoryCount = await tx.category.count({ where: { menuId } });
      const itemCount = await tx.item.count({ where: { category: { menuId } } });
      if (categoryCount > 0 || itemCount > 0) throw new Error("menu_has_data");

      await tx.menu.delete({ where: { id: menuId } });
    }, serializableTransaction);
  } catch (err) {
    if (err instanceof Error && err.message === "menu_has_data") {
      return NextResponse.json(
        {
          error: "Δεν μπορείς να διαγράψεις κατάλογο που έχει κατηγορίες ή πιάτα.",
          code: "menu_has_data",
        },
        { status: 400 },
      );
    }
    if (err instanceof Error && err.message === "menu_last") {
      return NextResponse.json(
        {
          error: "Πρέπει να υπάρχει τουλάχιστον ένας κατάλογος στο κατάστημα.",
          code: "menu_last",
        },
        { status: 400 },
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true, message: "Ο κατάλογος διαγράφηκε." });
}
