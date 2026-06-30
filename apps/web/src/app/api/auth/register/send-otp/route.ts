import { NextResponse } from "next/server";
import { prisma } from "@menuos/db";
import { registerOtpSendSchema } from "@menuos/shared";
import {
  checkRateLimitOutcome,
  clientIp,
  RATE_LIMIT_SERVER_ERROR,
} from "@/lib/rate-limit";
import { normalizeRegistrationEmail, sendRegistrationOtp } from "@/lib/registration-otp";

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Λάθος αίτημα." }, { status: 400 });
    }

    const parsed = registerOtpSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Μη έγκυρο email." }, { status: 400 });
    }

    const email = normalizeRegistrationEmail(parsed.data.email);
    const ip = clientIp(request);

    const ipLimit = await checkRateLimitOutcome(`register-otp:ip:${ip}`, 10, 60 * 60 * 1000);
    if (ipLimit === "unavailable") {
      return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
    }
    if (ipLimit === "limited") {
      return NextResponse.json(
        { error: "Πολλά αιτήματα. Δοκίμασε ξανά αργότερα.", code: "rate_limited" },
        { status: 429 },
      );
    }

    const emailLimit = await checkRateLimitOutcome(`register-otp:email:${email}`, 5, 60 * 60 * 1000);
    if (emailLimit === "unavailable") {
      return NextResponse.json(RATE_LIMIT_SERVER_ERROR, { status: 503 });
    }
    if (emailLimit === "limited") {
      return NextResponse.json(
        { error: "Πολλές αποστολές σε αυτό το email. Δοκίμασε αργότερα.", code: "rate_limited" },
        { status: 429 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Αυτό το email είναι ήδη εγγεγραμμένο.", code: "email_taken" },
        { status: 409 },
      );
    }

    const result = await sendRegistrationOtp(email);
    if (!result.ok) {
      const status =
        result.code === "cooldown" ? 429 : result.code === "email_taken" ? 409 : 400;
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status },
      );
    }

    return NextResponse.json({
      ok: true,
      expiresInSeconds: result.expiresInSeconds,
      message: "Στείλαμε 6ψήφιο κωδικό στο email σου.",
    });
  } catch (err) {
    console.error("[menuos] send-otp failed", err);
    return NextResponse.json(
      {
        error: "Πρόβλημα διακομιστή. Δοκίμασε σε λίγο ή γράψε στο info@b-os.gr.",
        code: "server_error",
      },
      { status: 503 },
    );
  }
}
