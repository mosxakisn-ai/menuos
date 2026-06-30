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
});

export const itemExtrasSchema = z.array(itemExtraSchema).max(12);

export type ItemExtra = z.infer<typeof itemExtraSchema>;
export type ItemExtrasConfig = ItemExtra[];

export function parseItemExtras(raw: unknown): ItemExtrasConfig {
  const parsed = itemExtrasSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
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
