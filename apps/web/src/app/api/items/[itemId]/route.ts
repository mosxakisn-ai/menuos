import { NextResponse } from "next/server";
import type { SupportedLanguage } from "@menuos/db";
import { prisma } from "@menuos/db";
import { itemPatchSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { autoFillMenuNames } from "@/lib/menu-translation-service";
import { getItemForOrganization } from "@/lib/venue-access";

type Params = { params: Promise<{ itemId: string }> };

async function upsertItemName(
  itemId: string,
  language: SupportedLanguage,
  name: string | undefined,
) {
  if (name === undefined) return;
  const trimmed = name.trim();
  if (!trimmed) {
    await prisma.itemTranslation.deleteMany({ where: { itemId, language } });
    return;
  }
  await prisma.itemTranslation.upsert({
    where: { itemId_language: { itemId, language } },
    create: { itemId, language, name: trimmed },
    update: { name: trimmed },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { itemId } = await params;
  const existing = await getItemForOrganization(itemId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Το πιάτο δεν βρέθηκε." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
  }

  const parsed = itemPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Μη έγκυρα δεδομένα πιάτου." }, { status: 400 });
  }

  let { nameGr, nameEn, nameDe, nameFr, available, price, label, photoUrl, extras } = parsed.data;

  if (nameGr !== undefined) {
    const filled = await autoFillMenuNames({ nameGr, nameEn, nameDe, nameFr });
    nameGr = filled.nameGr;
    const retranslateAll = nameEn === undefined && nameDe === undefined && nameFr === undefined;
    nameEn = retranslateAll ? (filled.nameEn ?? "") : (filled.nameEn ?? undefined);
    nameDe = retranslateAll ? (filled.nameDe ?? "") : (filled.nameDe ?? undefined);
    nameFr = retranslateAll ? (filled.nameFr ?? "") : (filled.nameFr ?? undefined);
  }

  const normalizedPhoto =
    photoUrl === undefined
      ? undefined
      : photoUrl === "" || photoUrl === null
        ? null
        : photoUrl.trim();

  const normalizedExtras =
    extras === undefined ? undefined : extras.length > 0 ? extras : [];

  await prisma.item.update({
    where: { id: itemId },
    data: {
      ...(available !== undefined ? { available } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(label !== undefined ? { label } : {}),
      ...(normalizedPhoto !== undefined ? { photoUrl: normalizedPhoto } : {}),
      ...(normalizedExtras !== undefined ? { extras: normalizedExtras } : {}),
    },
  });

  await upsertItemName(itemId, "GR", nameGr);
  await upsertItemName(itemId, "EN", nameEn);
  await upsertItemName(itemId, "DE", nameDe);
  await upsertItemName(itemId, "FR", nameFr);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { translations: true },
  });

  return NextResponse.json({
    item,
    message: available === false ? "Το πιάτο απενεργοποιήθηκε." : "Το πιάτο ενημερώθηκε.",
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const { itemId } = await params;
  const existing = await getItemForOrganization(itemId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: "Το πιάτο δεν βρέθηκε." }, { status: 404 });
  }

  await prisma.item.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true, message: "Το πιάτο διαγράφηκε." });
}
