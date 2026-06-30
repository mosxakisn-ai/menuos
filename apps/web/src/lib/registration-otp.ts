import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@menuos/db";
import { sendRegistrationOtpEmail } from "@/lib/mail";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

function generateOtpCode(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export async function sendRegistrationOtp(email: string): Promise<
  | { ok: true; expiresInSeconds: number }
  | { ok: false; error: string; code?: string; retryAfterSeconds?: number }
> {
  const normalized = normalizeRegistrationEmail(email);

  const existingUser = await prisma.user.findUnique({ where: { email: normalized } });
  if (existingUser) {
    return { ok: false, error: "Αυτό το email είναι ήδη εγγεγραμμένο.", code: "email_taken" };
  }

  const existing = await prisma.registrationOtp.findUnique({ where: { email: normalized } });
  if (existing) {
    const sinceLastSend = Date.now() - existing.lastSentAt.getTime();
    if (sinceLastSend < RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - sinceLastSend) / 1000);
      return {
        ok: false,
        error: `Περίμενε ${retryAfterSeconds} δευτ. πριν ξαναστείλεις κωδικό.`,
        code: "cooldown",
        retryAfterSeconds,
      };
    }
  }

  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.registrationOtp.upsert({
    where: { email: normalized },
    create: {
      email: normalized,
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
    update: {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    },
  });

  try {
    await sendRegistrationOtpEmail({ to: normalized, code });
  } catch (err) {
    console.error("[menuos-mail] OTP send failed", err);
    await prisma.registrationOtp.delete({ where: { email: normalized } }).catch(() => undefined);
    return {
      ok: false,
      error: "Δεν ήταν δυνατή η αποστολή email. Δοκίμασε ξανά σε λίγο.",
      code: "mail_failed",
    };
  }

  return { ok: true, expiresInSeconds: OTP_TTL_MS / 1000 };
}

export async function verifyRegistrationOtp(email: string, otp: string): Promise<
  | { ok: true }
  | { ok: false; error: string; code?: string }
> {
  const normalized = normalizeRegistrationEmail(email);

  return prisma.$transaction(async (tx) => {
    const record = await tx.registrationOtp.findUnique({ where: { email: normalized } });

    if (!record) {
      return {
        ok: false as const,
        error: "Δεν βρέθηκε κωδικός. Στείλε νέο κωδικό στο email σου.",
        code: "otp_missing",
      };
    }

    if (record.expiresAt.getTime() < Date.now()) {
      await tx.registrationOtp.delete({ where: { email: normalized } }).catch(() => undefined);
      return { ok: false as const, error: "Ο κωδικός έληξε. Στείλε νέον κωδικό.", code: "otp_expired" };
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      await tx.registrationOtp.delete({ where: { email: normalized } }).catch(() => undefined);
      return {
        ok: false as const,
        error: "Πολλές λανθασμένες προσπάθειες. Στείλε νέο κωδικό.",
        code: "otp_locked",
      };
    }

    const valid = await bcrypt.compare(otp, record.codeHash);
    if (!valid) {
      await tx.registrationOtp.update({
        where: { email: normalized },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false as const, error: "Λάθος κωδικός. Έλεγξε το email σου.", code: "otp_invalid" };
    }

    return { ok: true as const };
  });
}

export async function consumeRegistrationOtp(email: string): Promise<void> {
  const normalized = normalizeRegistrationEmail(email);
  await prisma.registrationOtp.delete({ where: { email: normalized } }).catch(() => undefined);
}
