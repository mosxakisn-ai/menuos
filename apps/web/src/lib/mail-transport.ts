import nodemailer from "nodemailer";

/**
 * Office 365 mailbox — ίδιο με MatchWork / BM Cloud Admin:
 * MAILBOX_PASSWORD + MAILBOX_USER (admin@s1cloud.b-os.gr) → smtp.office365.com:587
 */
export function isMailConfigured(): boolean {
  if (process.env.MAILBOX_PASSWORD && (process.env.MAILBOX_USER || process.env.SMTP_USER)) {
    return true;
  }
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function createMailTransporter() {
  if (process.env.MAILBOX_PASSWORD) {
    const user = process.env.MAILBOX_USER || process.env.SMTP_USER;
    if (!user) {
      throw new Error("MAILBOX_USER required when MAILBOX_PASSWORD is set");
    }
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user,
        pass: process.env.MAILBOX_PASSWORD,
      },
    });
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP not configured");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export function mailFromAddress(): string {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const user = process.env.MAILBOX_USER || process.env.SMTP_USER;
  if (user) return `"MenuOS" <${user}>`;
  return "MenuOS <noreply@menuos.gr>";
}
