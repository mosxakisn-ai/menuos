import { z } from "zod";

export const orderLineSchema = z.object({
  itemId: z.string().min(1).max(50),
  name: z.string().min(1).max(120),
  quantity: z.number().int().min(1).max(99),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export type OrderLine = z.infer<typeof orderLineSchema>;

export type OrderPayload = {
  lines: OrderLine[];
  total: string;
  lang?: string;
};

export function cartStorageKey(venueSlug: string, tableNumber?: string, roomNumber?: string) {
  return `menuos-cart:${venueSlug}:${tableNumber ?? ""}:${roomNumber ?? ""}`;
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
  const idx = lines.findIndex((l) => l.itemId === next.itemId);
  if (idx === -1) return [...lines, next];
  const merged = [...lines];
  merged[idx] = {
    ...merged[idx]!,
    quantity: Math.min(99, merged[idx]!.quantity + next.quantity),
    name: next.name,
    unitPrice: next.unitPrice,
  };
  return merged;
}

export function updateCartLineQty(lines: OrderLine[], itemId: string, quantity: number): OrderLine[] {
  if (quantity < 1) return lines.filter((l) => l.itemId !== itemId);
  return lines.map((l) => (l.itemId === itemId ? { ...l, quantity: Math.min(99, quantity) } : l));
}

export function buildOrderPayload(lines: OrderLine[], lang?: string): OrderPayload {
  return { lines, total: cartTotal(lines), lang };
}
