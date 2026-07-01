import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { categoryCreateSchema, buildMenuNameTranslations } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";
import { autoFillMenuNames } from "@/lib/menu-translation-service";
import { getMenuForOrganization } from "@/lib/venue-access";

export async function POST(request: Request) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const A = copy.api;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: A.badRequest }, { status: 400 });
  }

  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: A.fillCategoryNameGr }, { status: 400 });
  }

  const names = await autoFillMenuNames(parsed.data);

  const menu = await getMenuForOrganization(parsed.data.menuId, auth.session!.organizationId);
  if (!menu) {
    return NextResponse.json({ error: A.menuNotFound }, { status: 404 });
  }

  const maxSort = await prisma.category.aggregate({
    where: { menuId: parsed.data.menuId },
    _max: { sortOrder: true },
  });

  const translations = buildMenuNameTranslations(names);

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
    message: A.categoryAdded(parsed.data.nameGr),
  });
}
