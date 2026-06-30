import {
  buildRegistrationOtpEmailHtml,
  buildRegistrationOtpEmailText,
  buildSubscriptionActivatedEmailHtml,
  buildSubscriptionActivatedEmailText,
  buildTrialEndingReminderEmailHtml,
  buildTrialEndingReminderEmailText,
  buildTrialExpiredEmailHtml,
  buildTrialExpiredEmailText,
  buildTrialMidReminderEmailHtml,
  buildTrialMidReminderEmailText,
  buildWelcomeEmailHtml,
  buildWelcomeEmailText,
} from "@/lib/mail-templates";
import { TRIAL_DAYS } from "@menuos/shared";
import { createMailTransporter, isMailConfigured, mailFromAddress } from "@/lib/mail-transport";

export { isMailConfigured };

async function sendBrandedEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  logLabel: string;
  throwIfUnconfigured?: boolean;
}): Promise<void> {
  if (!isMailConfigured()) {
    if (input.throwIfUnconfigured && process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured");
    }
    console.log(`[menuos-mail] ${input.logLabel} → ${input.to}`);
    return;
  }

  const transporter = createMailTransporter();
  await transporter.sendMail({
    from: mailFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export async function sendRegistrationOtpEmail(input: {
  to: string;
  code: string;
  ttlMinutes?: number;
}): Promise<void> {
  const ttlMinutes = input.ttlMinutes ?? 30;
  await sendBrandedEmail({
    to: input.to,
    subject: "MenuOS — κωδικός επιβεβαίωσης εγγραφής",
    text: buildRegistrationOtpEmailText({ code: input.code, ttlMinutes }),
    html: buildRegistrationOtpEmailHtml({ code: input.code, ttlMinutes }),
    logLabel: `register OTP code=${input.code}`,
    throwIfUnconfigured: true,
  });
}

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  businessName: string;
  trialEndsAt: Date;
}): Promise<void> {
  const trialEndsAt = input.trialEndsAt.toLocaleDateString("el-GR");
  await sendBrandedEmail({
    to: input.to,
    subject: "MenuOS — καλώς ήρθες · ξεκίνα τη δοκιμή σου",
    text: buildWelcomeEmailText({
      name: input.name,
      businessName: input.businessName,
      trialEndsAt,
      trialDays: TRIAL_DAYS,
    }),
    html: buildWelcomeEmailHtml({
      name: input.name,
      businessName: input.businessName,
      trialEndsAt,
      trialDays: TRIAL_DAYS,
    }),
    logLabel: `welcome (${input.businessName})`,
  });
}

export async function sendSubscriptionActivatedEmail(input: {
  to: string;
  name: string;
  businessName: string;
  planName: string;
  priceMonthly: number;
  renewalDate?: string | null;
}): Promise<void> {
  await sendBrandedEmail({
    to: input.to,
    subject: `MenuOS — πλάνο ${input.planName} ενεργό`,
    text: buildSubscriptionActivatedEmailText(input),
    html: buildSubscriptionActivatedEmailHtml(input),
    logLabel: `subscription (${input.planName})`,
  });
}

export async function sendTrialMidReminderEmail(input: {
  to: string;
  name: string;
  businessName: string;
  trialEndsAt: Date;
  daysLeft: number;
}): Promise<void> {
  const trialEndsAt = input.trialEndsAt.toLocaleDateString("el-GR");
  await sendBrandedEmail({
    to: input.to,
    subject: `MenuOS — ${input.daysLeft} μέρες απομένουν στη δοκιμή σου`,
    text: buildTrialMidReminderEmailText({
      name: input.name,
      businessName: input.businessName,
      trialEndsAt,
      daysLeft: input.daysLeft,
    }),
    html: buildTrialMidReminderEmailHtml({
      name: input.name,
      businessName: input.businessName,
      trialEndsAt,
      daysLeft: input.daysLeft,
    }),
    logLabel: "trial-mid",
  });
}

export async function sendTrialEndingReminderEmail(input: {
  to: string;
  name: string;
  businessName: string;
  trialEndsAt: Date;
}): Promise<void> {
  const trialEndsAt = input.trialEndsAt.toLocaleDateString("el-GR");
  await sendBrandedEmail({
    to: input.to,
    subject: `MenuOS — η δοκιμή σου λήγει ${trialEndsAt}`,
    text: buildTrialEndingReminderEmailText({
      name: input.name,
      businessName: input.businessName,
      trialEndsAt,
    }),
    html: buildTrialEndingReminderEmailHtml({
      name: input.name,
      businessName: input.businessName,
      trialEndsAt,
    }),
    logLabel: "trial-ending",
  });
}

export async function sendTrialExpiredEmail(input: {
  to: string;
  name: string;
  businessName: string;
}): Promise<void> {
  await sendBrandedEmail({
    to: input.to,
    subject: "MenuOS — η δωρεάν δοκιμή έληξε",
    text: buildTrialExpiredEmailText({
      name: input.name,
      businessName: input.businessName,
    }),
    html: buildTrialExpiredEmailHtml({
      name: input.name,
      businessName: input.businessName,
    }),
    logLabel: "trial-expired",
  });
}
