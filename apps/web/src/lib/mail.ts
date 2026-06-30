import {
  buildRegistrationOtpEmailHtml,
  buildRegistrationOtpEmailText,
  buildSubscriptionActivatedEmailHtml,
  buildSubscriptionActivatedEmailText,
  buildWelcomeEmailHtml,
  buildWelcomeEmailText,
} from "@/lib/mail-templates";
import { createMailTransporter, isMailConfigured, mailFromAddress } from "@/lib/mail-transport";

export { isMailConfigured };

export async function sendRegistrationOtpEmail(input: { to: string; code: string }): Promise<void> {
  const subject = "MenuOS — κωδικός επιβεβαίωσης εγγραφής";
  const text = buildRegistrationOtpEmailText({ code: input.code });
  const html = buildRegistrationOtpEmailHtml({ code: input.code });

  if (!isMailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured");
    }
    console.log(`[menuos-mail] register OTP → ${input.to} code=${input.code}`);
    return;
  }

  const transporter = createMailTransporter();
  await transporter.sendMail({
    from: mailFromAddress(),
    to: input.to,
    subject,
    text,
    html,
  });
}

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  businessName: string;
  trialEndsAt: Date;
}): Promise<void> {
  const trialEndsAt = input.trialEndsAt.toLocaleDateString("el-GR");
  const subject = "MenuOS — καλώς ήρθες";
  const text = buildWelcomeEmailText({
    name: input.name,
    businessName: input.businessName,
    trialEndsAt,
  });
  const html = buildWelcomeEmailHtml({
    name: input.name,
    businessName: input.businessName,
    trialEndsAt,
  });

  if (!isMailConfigured()) {
    console.log(`[menuos-mail] welcome → ${input.to} (${input.businessName})`);
    return;
  }

  const transporter = createMailTransporter();
  await transporter.sendMail({
    from: mailFromAddress(),
    to: input.to,
    subject,
    text,
    html,
  });
}

export async function sendSubscriptionActivatedEmail(input: {
  to: string;
  name: string;
  businessName: string;
  planId: string;
  priceMonthly: number;
}): Promise<void> {
  const planName = input.planId.charAt(0) + input.planId.slice(1).toLowerCase();
  const subject = `MenuOS — ${planName} ενεργό`;
  const text = buildSubscriptionActivatedEmailText({
    name: input.name,
    businessName: input.businessName,
    planName,
    priceMonthly: input.priceMonthly,
  });
  const html = buildSubscriptionActivatedEmailHtml({
    name: input.name,
    businessName: input.businessName,
    planName,
    priceMonthly: input.priceMonthly,
  });

  if (!isMailConfigured()) {
    console.log(`[menuos-mail] subscription → ${input.to} (${planName})`);
    return;
  }

  const transporter = createMailTransporter();
  await transporter.sendMail({
    from: mailFromAddress(),
    to: input.to,
    subject,
    text,
    html,
  });
}
