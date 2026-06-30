import { prisma } from "@menuos/db";
import { buildOrderPayload, type OrderPayload } from "@menuos/shared";

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
  const lines = incoming.lines.map((line) => {
    const item = byId.get(line.itemId)!;
    const name =
      item.translations.find((t) => t.language === "GR")?.name ??
      item.translations[0]?.name ??
      line.name;
    return {
      itemId: line.itemId,
      name,
      quantity: line.quantity,
      unitPrice: formatMenuPrice(item.price),
    };
  });

  return buildOrderPayload(lines, incoming.lang);
}
