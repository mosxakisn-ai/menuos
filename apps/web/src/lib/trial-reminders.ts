import { UserRole, prisma } from "@menuos/db";
import { getTrialDaysLeft } from "@menuos/shared";
import {
  sendTrialEndingReminderEmail,
  sendTrialExpiredEmail,
  sendTrialMidReminderEmail,
} from "@/lib/mail";

export type TrialReminderResult = {
  checked: number;
  mid: number;
  ending: number;
  expired: number;
  skipped: number;
  errors: number;
};

async function findTrialAdmin(organizationId: string) {
  return prisma.user.findFirst({
    where: { organizationId, role: UserRole.ADMIN },
    orderBy: { createdAt: "asc" },
    select: { email: true, name: true },
  });
}

export async function processTrialReminderEmails(now = new Date()): Promise<TrialReminderResult> {
  const result: TrialReminderResult = {
    checked: 0,
    mid: 0,
    ending: 0,
    expired: 0,
    skipped: 0,
    errors: 0,
  };

  const subscriptions = await prisma.subscription.findMany({
    where: {
      plan: "TRIAL",
      trialEndsAt: { not: null },
    },
    include: {
      organization: { select: { id: true, name: true } },
    },
  });

  for (const sub of subscriptions) {
    result.checked += 1;
    const trialEndsAt = sub.trialEndsAt!;
    const daysLeft = getTrialDaysLeft(trialEndsAt, now);
    const admin = await findTrialAdmin(sub.organizationId);
    if (!admin?.email) {
      result.skipped += 1;
      continue;
    }

    const mailInput = {
      to: admin.email,
      name: admin.name,
      businessName: sub.organization.name,
      trialEndsAt,
    };

    try {
      if (daysLeft <= 0 && !sub.trialExpiredEmailSentAt) {
        await sendTrialExpiredEmail(mailInput);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { trialExpiredEmailSentAt: now },
        });
        result.expired += 1;
        continue;
      }

      if (daysLeft === 1 && !sub.trialEndingEmailSentAt) {
        await sendTrialEndingReminderEmail(mailInput);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { trialEndingEmailSentAt: now },
        });
        result.ending += 1;
        continue;
      }

      if (daysLeft >= 2 && daysLeft <= 4 && !sub.trialMidEmailSentAt) {
        await sendTrialMidReminderEmail({ ...mailInput, daysLeft });
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { trialMidEmailSentAt: now },
        });
        result.mid += 1;
        continue;
      }

      result.skipped += 1;
    } catch (err) {
      result.errors += 1;
      console.error("[menuos-trial-reminders]", sub.organizationId, err);
    }
  }

  return result;
}
