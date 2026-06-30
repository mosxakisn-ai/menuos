import { Prisma } from "@menuos/db";
import { getPlan, organizationHasPaidPlan, type PlanDefinition } from "@menuos/shared";

export const serializableTransaction = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;

export class PlanLimitError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PlanLimitError";
    this.code = code;
  }
}

type PlanContext = {
  active: boolean;
  plan: PlanDefinition;
};

async function planContextInTransaction(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<PlanContext> {
  const org = await tx.organization.findUnique({
    where: { id: organizationId },
    include: { subscription: true },
  });
  if (!org) {
    throw new PlanLimitError("not_found", "Ο οργανισμός δεν βρέθηκε.");
  }

  const sub = org.subscription;
  if (!sub) {
    return { active: false, plan: getPlan("TRIAL") };
  }

  const active = organizationHasPaidPlan({
    plan: sub.plan,
    status: sub.status,
    trialEndsAt: sub.trialEndsAt,
  });

  return {
    active,
    plan: getPlan(sub.plan),
  };
}

export async function assertCanAddVenueInTransaction(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  const ctx = await planContextInTransaction(tx, organizationId);
  if (!ctx.active) {
    throw new PlanLimitError(
      "trial_expired",
      "Η δοκιμαστική περίοδος έληξε. Αναβάθμισε για να προσθέσεις μαγαζιά.",
    );
  }

  const count = await tx.venue.count({ where: { organizationId } });
  if (count >= ctx.plan.maxVenues) {
    throw new PlanLimitError(
      "venue_limit",
      `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${ctx.plan.maxVenues} μαγαζιά.`,
    );
  }
}

export async function assertCanAddMenuInTransaction(
  tx: Prisma.TransactionClient,
  organizationId: string,
  venueId: string,
): Promise<void> {
  const ctx = await planContextInTransaction(tx, organizationId);
  if (!ctx.active) {
    throw new PlanLimitError("subscription_inactive", "Η συνδρομή δεν είναι ενεργή.");
  }

  const maxMenus = ctx.plan.maxMenusPerVenue;
  if (maxMenus === null) return;

  const count = await tx.menu.count({ where: { venueId } });
  if (count >= maxMenus) {
    throw new PlanLimitError(
      "menu_limit",
      `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${maxMenus} menu ανά μαγαζί.`,
    );
  }
}

export async function assertCanAddItemsInTransaction(
  tx: Prisma.TransactionClient,
  organizationId: string,
  countToAdd: number,
): Promise<void> {
  if (countToAdd < 1) return;

  const ctx = await planContextInTransaction(tx, organizationId);
  if (!ctx.active) {
    throw new PlanLimitError("subscription_inactive", "Η συνδρομή δεν είναι ενεργή.");
  }

  const maxItems = ctx.plan.maxItems;
  if (maxItems === null) return;

  const count = await tx.item.count({
    where: { category: { menu: { venue: { organizationId } } } },
  });
  if (count + countToAdd > maxItems) {
    const remaining = Math.max(0, maxItems - count);
    throw new PlanLimitError(
      "item_limit",
      remaining > 0
        ? `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${maxItems} πιάτα. Μπορείς να προσθέσεις ακόμα ${remaining}.`
        : `Το πλάνο ${ctx.plan.name} επιτρέπει μέχρι ${maxItems} πιάτα.`,
    );
  }
}

export function planLimitErrorResponse(err: unknown) {
  if (err instanceof PlanLimitError) {
    return { error: err.message, code: err.code, status: 403 as const };
  }
  return null;
}
