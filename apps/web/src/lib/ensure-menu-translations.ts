import { prisma } from "@menuos/db";
import { MENU_AUTO_TRANSLATE_LANGS } from "@menuos/shared";
import {
  backfillOrganizationMenuTranslations,
  organizationNeedsTranslationBackfill,
} from "@/lib/catalog-backfill-translations";

const SYNC_ITEM_LIMIT = 80;
const SYNC_TIMEOUT_MS = 25_000;
const BACKFILL_COOLDOWN_MS = 30 * 60_000;

const backfillInflight = new Map<string, Promise<void>>();
const backfillCooldownUntil = new Map<string, number>();

function runBackfillOnce(organizationId: string): Promise<void> {
  const existing = backfillInflight.get(organizationId);
  if (existing) return existing;

  const job = backfillOrganizationMenuTranslations(organizationId)
    .catch(() => undefined)
    .finally(() => {
      backfillInflight.delete(organizationId);
      backfillCooldownUntil.set(organizationId, Date.now() + BACKFILL_COOLDOWN_MS);
    })
    .then(() => undefined);

  backfillInflight.set(organizationId, job);
  return job;
}

/** Συμπληρώνει μεταφράσεις πριν το public QR menu — await για μικρά menus, background για μεγάλα. */
export async function ensureMenuTranslationsBeforeRender(organizationId: string): Promise<{
  ran: boolean;
  timedOut?: boolean;
}> {
  if ((backfillCooldownUntil.get(organizationId) ?? 0) > Date.now()) {
    return { ran: false };
  }

  try {
    const needs = await organizationNeedsTranslationBackfill(organizationId);
    if (!needs) return { ran: false };

    const itemCount = await prisma.item.count({
      where: { category: { menu: { venue: { organizationId } } } },
    });

    if (itemCount > SYNC_ITEM_LIMIT) {
      void runBackfillOnce(organizationId);
      return { ran: true };
    }

    try {
      await Promise.race([
        runBackfillOnce(organizationId),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("translation_backfill_timeout")), SYNC_TIMEOUT_MS);
        }),
      ]);
      return { ran: true };
    } catch (err) {
      const timedOut = err instanceof Error && err.message === "translation_backfill_timeout";
      if (!timedOut) throw err;
      void runBackfillOnce(organizationId);
      return { ran: true, timedOut: true };
    }
  } catch {
    // Μην ρίχνουμε 500 στο public QR menu αν αποτύχει το DeepL/MyMemory ή η migration δεν έχει τρέξει.
    return { ran: false };
  }
}

export const EXPECTED_MENU_TRANSLATION_LANG_COUNT = 1 + MENU_AUTO_TRANSLATE_LANGS.length;
