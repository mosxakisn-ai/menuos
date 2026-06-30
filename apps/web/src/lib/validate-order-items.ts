import { prisma } from "@menuos/db";
import {
  buildOrderPayload,
  mergeCartLine,
  parseQrMenuLanguage,
  filterValidExtraIds,
  resolveExtraLabels,
  parseItemExtras,
  type OrderLine,
  type OrderPayload,
} from "@menuos/shared";

function formatMenuPrice(price: { toString(): string }): string {
  const n = Number(price.toString());
  if (!Number.isFinite(n) || n < 0) return "0";
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

/** Validates cart lines against venue menu and returns server-trusted prices/names. */
export async function validateOrderItemsForVenue(
  venueId: string,
  incoming: OrderPayload,
): Promise<OrderPayload | null> {
  if (incoming.lines.length === 0) return null;

  const lang = parseQrMenuLanguage(incoming.lang);
  const ids = [...new Set(incoming.lines.map((l) => l.itemId))];
  const items = await prisma.item.findMany({
    where: {
      id: { in: ids },
      available: true,
      category: { menu: { venueId, isActive: true } },
    },
    include: { translations: true },
  });

  if (items.length !== ids.length) return null;

  const byId = new Map(items.map((item) => [item.id, item]));
  let merged: OrderLine[] = [];
  for (const line of incoming.lines) {
    const item = byId.get(line.itemId);
    if (!item) return null;
    const name =
      item.translations.find((t) => t.language === lang)?.name ??
      item.translations.find((t) => t.language === "GR")?.name ??
      item.translations[0]?.name ??
      line.name;
    const itemExtras = parseItemExtras(item.extras);
    const extraIds = filterValidExtraIds(itemExtras, line.extraIds);
    const extras = resolveExtraLabels(itemExtras, extraIds, lang);
    const note = line.note?.trim().slice(0, 80) || undefined;
    merged = mergeCartLine(merged, {
      itemId: line.itemId,
      name,
      quantity: line.quantity,
      unitPrice: formatMenuPrice(item.price),
      ...(extraIds.length ? { extraIds } : {}),
      ...(extras.length ? { extras } : {}),
      ...(note ? { note } : {}),
    });
  }

  return buildOrderPayload(merged, incoming.lang);
}
