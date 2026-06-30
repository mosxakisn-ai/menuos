import { z } from "zod";
import type { QrMenuLanguage } from "./menu-languages";

export const itemExtraLabelsSchema = z.object({
  GR: z.string().trim().min(1).max(60),
  EN: z.string().trim().max(60).optional(),
  DE: z.string().trim().max(60).optional(),
  FR: z.string().trim().max(60).optional(),
});

export const itemExtraSchema = z.object({
  id: z.string().min(1).max(32),
  labels: itemExtraLabelsSchema,
  price: z.number().min(0).max(999.99).optional(),
});

export const itemExtrasSchema = z.array(itemExtraSchema).max(12);

export type ItemExtra = z.infer<typeof itemExtraSchema>;
export type ItemExtrasConfig = ItemExtra[];

export function parseItemExtras(raw: unknown): ItemExtrasConfig {
  if (!Array.isArray(raw)) return [];
  const extras: ItemExtrasConfig = [];
  for (const entry of raw) {
    const parsed = itemExtraSchema.safeParse(entry);
    if (parsed.success) extras.push(parsed.data);
  }
  return extras.slice(0, 12);
}

export function pickItemExtraLabel(extra: ItemExtra, lang: QrMenuLanguage): string {
  const l = extra.labels;
  if (lang === "EN" && l.EN) return l.EN;
  if (lang === "DE" && l.DE) return l.DE;
  if (lang === "FR" && l.FR) return l.FR;
  return l.GR;
}

export function resolveExtraLabels(
  config: ItemExtrasConfig,
  extraIds: string[] | undefined,
  lang: QrMenuLanguage,
): string[] {
  if (!extraIds?.length || config.length === 0) return [];
  const byId = new Map(config.map((e) => [e.id, e]));
  const labels: string[] = [];
  for (const id of extraIds) {
    const extra = byId.get(id);
    if (extra) labels.push(pickItemExtraLabel(extra, lang));
  }
  return labels;
}

export function filterValidExtraIds(config: ItemExtrasConfig, extraIds: string[] | undefined): string[] {
  if (!extraIds?.length || config.length === 0) return [];
  const allowed = new Set(config.map((e) => e.id));
  return extraIds.filter((id) => allowed.has(id));
}

export function newItemExtraId(): string {
  return `ex_${Math.random().toString(36).slice(2, 10)}`;
}

export function itemExtraPrice(extra: ItemExtra | undefined): number {
  if (!extra?.price || !Number.isFinite(extra.price) || extra.price <= 0) return 0;
  return extra.price;
}

export function sumExtraPrices(config: ItemExtrasConfig, extraIds: string[] | undefined): number {
  if (!extraIds?.length || config.length === 0) return 0;
  const byId = new Map(config.map((e) => [e.id, e]));
  return extraIds.reduce((sum, id) => sum + itemExtraPrice(byId.get(id)), 0);
}

export function computeItemUnitPrice(
  basePrice: number | { toString(): string },
  itemExtras: ItemExtrasConfig,
  extraIds: string[] | undefined,
): string {
  const base = Number(typeof basePrice === "object" ? basePrice.toString() : basePrice);
  const total = base + sumExtraPrices(itemExtras, extraIds);
  if (!Number.isFinite(total) || total < 0) return "0";
  return total.toFixed(total % 1 === 0 ? 0 : 2);
}

export function formatExtraPriceSuffix(extra: ItemExtra): string | null {
  const price = itemExtraPrice(extra);
  if (price <= 0) return null;
  return price % 1 === 0 ? `+€${price.toFixed(0)}` : `+€${price.toFixed(2)}`;
}

export function formatOrderLineDetail(line: {
  extras?: string[];
  note?: string;
}): string | null {
  const parts: string[] = [];
  if (line.extras?.length) parts.push(...line.extras);
  const note = line.note?.trim();
  if (note) parts.push(note);
  return parts.length ? parts.join(" · ") : null;
}
