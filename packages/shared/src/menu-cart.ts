import { z } from "zod";

export const orderLineSchema = z.object({
  itemId: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(99),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  extraIds: z.array(z.string().min(1).max(32)).max(12).optional(),
  extras: z.array(z.string().max(60)).max(12).optional(),
  note: z.string().max(80).optional(),
});

export type OrderLine = z.infer<typeof orderLineSchema>;

export type OrderPayload = {
  lines: OrderLine[];
  total: string;
  lang?: string;
};

export function orderLineKey(line: Pick<OrderLine, "itemId" | "extraIds" | "note">): string {
  const ids = [...(line.extraIds ?? [])].sort().join(",");
  const note = line.note?.trim() ?? "";
  return `${line.itemId}|${ids}|${note}`;
}

export function cartStorageKey(
  venueSlug: string,
  tableNumber?: string,
  roomNumber?: string,
  sunbedNumber?: string,
) {
  return `menuos-cart:${venueSlug}:${tableNumber ?? ""}:${roomNumber ?? ""}:${sunbedNumber ?? ""}`;
}

export function parseCartJson(raw: string | null): OrderLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((line) => orderLineSchema.safeParse(line))
      .filter((r) => r.success)
      .map((r) => r.data);
  } catch {
    return [];
  }
}

export function lineTotal(line: OrderLine): number {
  return Number(line.unitPrice) * line.quantity;
}

export function cartTotal(lines: OrderLine[]): string {
  const sum = lines.reduce((acc, line) => acc + lineTotal(line), 0);
  return sum.toFixed(sum % 1 === 0 ? 0 : 2);
}

export function cartItemCount(lines: OrderLine[]): number {
  return lines.reduce((acc, line) => acc + line.quantity, 0);
}

export function mergeCartLine(lines: OrderLine[], next: OrderLine): OrderLine[] {
  const key = orderLineKey(next);
  const idx = lines.findIndex((l) => orderLineKey(l) === key);
  if (idx === -1) return [...lines, next];
  const merged = [...lines];
  merged[idx] = {
    ...merged[idx]!,
    quantity: Math.min(99, merged[idx]!.quantity + next.quantity),
    name: next.name,
    unitPrice: next.unitPrice,
    extraIds: next.extraIds,
    extras: next.extras,
    note: next.note,
  };
  return merged;
}

export function updateCartLineQty(lines: OrderLine[], lineKey: string, quantity: number): OrderLine[] {
  if (quantity < 1) return lines.filter((l) => orderLineKey(l) !== lineKey);
  return lines.map((l) =>
    orderLineKey(l) === lineKey ? { ...l, quantity: Math.min(99, quantity) } : l,
  );
}

export function buildOrderPayload(lines: OrderLine[], lang?: string): OrderPayload {
  return { lines, total: cartTotal(lines), lang };
}

export function parseOrderPayload(raw: unknown): OrderPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as OrderPayload;
  if (!Array.isArray(o.lines)) return null;
  const lines = o.lines
    .map((line) => orderLineSchema.safeParse(line))
    .filter((r) => r.success)
    .map((r) => r.data);
  if (lines.length === 0) return null;
  return { lines, total: cartTotal(lines), lang: o.lang };
}

/** Merge new order lines into an existing pending order payload. */
export function mergeOrderPayload(existing: unknown, incoming: OrderPayload): OrderPayload {
  const prev = parseOrderPayload(existing);
  let merged = prev?.lines ?? [];
  for (const line of incoming.lines) {
    merged = mergeCartLine(merged, line);
  }
  return {
    lines: merged,
    total: cartTotal(merged),
    lang: incoming.lang ?? prev?.lang,
  };
}
