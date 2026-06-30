import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { categoryCreateSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { getMenuForOrganization } from "@/lib/venue-access";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Συμπλήρωσε όνομα κατηγορίας (Ελληνικά)." }, { status: 400 });
  }

  const menu = await getMenuForOrganization(parsed.data.menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  const maxSort = await prisma.category.aggregate({
    where: { menuId: parsed.data.menuId },
    _max: { sortOrder: true },
  });

  const translations = [
    { language: "GR" as const, name: parsed.data.nameGr.trim() },
    ...(parsed.data.nameEn?.trim()
      ? [{ language: "EN" as const, name: parsed.data.nameEn.trim() }]
      : []),
  ];

  const category = await prisma.category.create({
    data: {
      menuId: parsed.data.menuId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      translations: { create: translations },
    },
    include: { translations: true, items: { include: { translations: true } } },
  });

  return NextResponse.json({
    category,
    message: `Η κατηγορία «${parsed.data.nameGr}» προστέθηκε.`,
  });
}
