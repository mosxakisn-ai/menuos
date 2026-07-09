import { NextResponse } from "next/server";
import type { SupportedLanguage } from "@menuos/db";
import { prisma } from "@menuos/db";
import { itemPatchSchema } from "@menuos/shared";
import { requireActiveSubscription } from "@/lib/api-auth";
import { autoFillMenuNames } from "@/lib/menu-translation-service";
import { getItemForOrganization } from "@/lib/venue-access";
import { normalizeStoredPhotoUrl } from "@/lib/photo-signing";
import { dashboardCopyFromRequest } from "@/lib/dashboard-request-locale";
import {
  patchProvidedAnyTranslatedName,
  upsertEntityNameTranslation,
} from "@/lib/menu-name-upsert";
import { upsertItemTranslationTextFields } from "@/lib/upsert-item-translation-fields";

type Params = { params: Promise<{ itemId: string }> };

async function upsertItemName(itemId: string, language: SupportedLanguage, name: string | undefined) {
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

  const copy = dashboardCopyFromRequest(request);
  const { catalogEntry } = copy;
  const A = copy.api;
  const { itemId } = await params;
  const existing = await getItemForOrganization(itemId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: catalogEntry.notFound }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: A.badRequest }, { status: 400 });
  }

  const parsed = itemPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: catalogEntry.invalidData }, { status: 400 });
  }

  const {
    available,
    price,
    label,
    photoUrl,
    extras,
    nameGr,
    descriptionGr,
    ingredientsGr,
    allergensGr,
    dietaryTags,
    allergenCodes,
    ...namePatch
  } = parsed.data;

  if (nameGr !== undefined) {
    const filled = await autoFillMenuNames({ nameGr, ...namePatch });
    await upsertEntityNameTranslation(
      (language, name) => upsertItemName(itemId, language, name),
      filled,
    );
  } else if (patchProvidedAnyTranslatedName(parsed.data as Record<string, unknown>)) {
    await upsertEntityNameTranslation(
      (language, name) => upsertItemName(itemId, language, name),
      { nameGr: "", ...namePatch },
    );
  }

  if (
    descriptionGr !== undefined ||
    ingredientsGr !== undefined ||
    allergensGr !== undefined
  ) {
    await upsertItemTranslationTextFields(itemId, {
      descriptionGr,
      ingredientsGr,
      allergensGr,
    });
  }

  const normalizedPhoto =
    photoUrl === undefined
      ? undefined
      : photoUrl === "" || photoUrl === null
        ? null
        : normalizeStoredPhotoUrl(photoUrl);

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
      ...(dietaryTags !== undefined ? { dietaryTags } : {}),
      ...(allergenCodes !== undefined ? { allergenCodes } : {}),
    },
  });

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { translations: true },
  });

  return NextResponse.json({
    item,
    message: available === false ? catalogEntry.deactivated : catalogEntry.updated,
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireActiveSubscription({ roles: ["ADMIN", "MANAGER"] });
  if (auth.response) return auth.response;

  const copy = dashboardCopyFromRequest(request);
  const { catalogEntry } = copy;
  const { itemId } = await params;
  const existing = await getItemForOrganization(itemId, auth.session!.organizationId);
  if (!existing) {
    return NextResponse.json({ error: catalogEntry.notFound }, { status: 404 });
  }

  await prisma.item.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true, message: catalogEntry.deleted });
}
